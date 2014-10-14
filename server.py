from flask import Flask
from flask import render_template, jsonify, request, redirect

from werkzeug import secure_filename

from hashlib import sha1

import psycopg2

import os
import urlparse
import time, json, base64, hmac, urllib, uuid

app = Flask("palate", static_folder="data")
app.config['UPLOAD_FOLDER'] = "data/img"

challengePics = [["ch3.JPG", "ch4.JPG", "ch5.JPG"], ["ch6.JPG", "ch7.JPG", "ch8.JPG"]]

urlparse.uses_netloc.append("postgres")
url = urlparse.urlparse(os.environ["DATABASE_URL"])

conn = psycopg2.connect(
    database=url.path[1:],
    user=url.username,
    password=url.password,
    host=url.hostname,
    port=url.port
)

def testDb():
	# Open a cursor to perform database operations
	cur = conn.cursor()

	print "hello!"

	# Execute a command: this creates a new table
	cur.execute("CREATE TABLE IF NOT EXISTS test (id serial PRIMARY KEY, num integer, data varchar);")

	# Pass data to fill a query placeholders and let Psycopg perform
	# the correct conversion (no more SQL injections!)
	cur.execute("INSERT INTO test (num, data) VALUES (%s, %s)", (100, "abc'def"))

	# Query the database and obtain data as Python objects
	cur.execute("SELECT * FROM test;")
	result = cur.fetchone()
	print str(result)

	# Make the changes to the database persistent
	conn.commit()

	# Close communication with the database
	cur.close()
	conn.close()

@app.route("/")
def home():
    return render_template('home.html')

@app.route("/challenges.json")
def getChallenges():
	challenges = []
	challenges.append({"id": 0, "title": "Meatless Mondays", "desc": "Don't eat meat on Mondays", "tags": ["Sustainable", "Fun"],
		"coverImageFile": "ch1.JPG", "detailImageFiles": challengePics[0], "countPeople": 351, "totalPics": 3, "donePics": 0})

	challenges.append({"id": 1, "title": "Farm to Table Meal", "desc": "Cook a Farm to Table dinner", "tags": ["Wacky", "Learn"], 
		"coverImageFile": "ch2.JPG", "detailImageFiles": challengePics[1], "countPeople": 562, "totalPics": 2, "donePics": 0})
	
	return jsonify({"items": challenges})    

@app.route("/pics/<filter>/<id>/pics.json")
def getChallengePicks(filter, id):
	pics = challengePics[int(id)]
	return jsonify({"items": pics})	

@app.route("/addUserPic/", methods=["GET", "POST"])
def addUserPic():
	print str(request.files)
	return redirect("/")

@app.route("/upload/", methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':

        userId = str(request['userId'])
        challengeId = str(request['challengeId'])
        stepId = str(request['stepId'])
        url = str(request['userImageURL'])

        print 'Uploaded UserId=%s challengeId=%s stepId=%s url=%s' % (userId, challengeId, stepId, url)

def get_file_name(userId, challengeId, stepId):
	return "img-" + userId + "-" + challengeId + "-" + stepId

@app.route('/sign_s3/')
def sign_s3():
    AWS_ACCESS_KEY = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    S3_BUCKET = os.environ.get('S3_BUCKET_NAME')

    random_uuid = uuid.uuid4()
    object_name = 'usr-img-%s' % (random_uuid)
    mime_type = request.args.get('s3_object_type')

    expires = long(time.time()+120)
    amz_headers = "x-amz-acl:public-read"

    put_request = "PUT\n\n%s\n%d\n%s\n/%s/%s" % (mime_type, expires, amz_headers, S3_BUCKET, object_name)

    signature = base64.encodestring(hmac.new(AWS_SECRET_KEY, put_request, sha1).digest())
    signature = urllib.quote_plus(signature.strip())

    url = 'https://%s.s3.amazonaws.com/%s' % (S3_BUCKET, object_name)

    return json.dumps({
        'signed_request': '%s?AWSAccessKeyId=%s&Expires=%d&Signature=%s' % (url, AWS_ACCESS_KEY, expires, signature),
        'url': url
    })	

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.debug = True
    testDb()
    app.run(host='0.0.0.0', port=port)
    
