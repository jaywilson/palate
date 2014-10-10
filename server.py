from flask import Flask
from flask import render_template, jsonify, request, redirect
from werkzeug import secure_filename

import os
import psycopg2
import urlparse

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

@app.route("/", methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        file = request.files['file']

        userId = request['userId']
        challengeId = request['challengeId']
        stepId = request['stepId']
        if file:
            filename = get_file_name(userId, challengeId, stepId)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return redirect(url_for('uploaded_file',
                                    filename=filename))	

def get_file_name(userId, challengeId, stepId):
	return "img-" + userId + "-" + challengeId + "-" + stepId

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.debug = True
    testDb()
    app.run(host='0.0.0.0', port=port)
    
