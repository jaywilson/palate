from flask import Flask
from flask import render_template, jsonify, request, redirect

from werkzeug import secure_filename

from hashlib import sha1

from palate import Palate

import os
import time, base64, hmac, urllib, uuid

app = Flask("palate", static_folder="data")

palate = Palate()
palate.createSchema()
palate.insertData()

@app.route("/")
def home():
    return render_template('home.html')

@app.route("/challenges")
def getChallenges():
    dbChallenges = palate.getChallenges()

    items = []
    for ch in dbChallenges:
        dbTags = palate.getChallengeTags(ch[0])

        tagItems = []
        for tag in dbTags:
            tagItems.append(tag[1])

    	items.append({
            "id": ch[0], 
            "title": ch[1], 
            "desc": ch[2], 
            "tags": tagItems,
    		"imageUuid": ch[3]
        })
	
    return jsonify({"items": items})    

@app.route("/home/<challengeId>")
def getChallengeHome(challengeId):
    userCount = palate.getChallengeUserCount(challengeId)[0][0]    
    imageUuids = palate.getChallengeImages(challengeId)
    challenge = palate.getChallenge(challengeId)[0]

    flatUuids = []
    for uuid in imageUuids:
        flatUuids.append(uuid[0])

    attr = {
        "id": challenge[0],
        "title": challenge[1],
        "desc": challenge[2],
        "userCount": userCount, 
        "imageUuids": flatUuids
    }

    return jsonify({"attributes": attr})    

# TODO determine how to fetch using multiple ID's,
# or the whole model object as form encoded like save
# or first create a feed using save and passing the Feed model <-- yes
@app.route("/feed", methods=["POST", "PUT"])
def saveChallengeFeed():
    if request.method == 'POST':
        feedModel = request.get_json()

        userId = feedModel['userId']
        challengeId = feedModel['challengeId']

        registrationId = palate.createRegistration(userId, challengeId);

        challenge = palate.getChallenge(challengeId)[0]

        print "challenge: " + str(challenge)

        imageUuids = palate.getChallengeImages(challengeId)

        print "imageUuids: " + str(imageUuids)

        currentStep = palate.getCurrentStep(userId, challengeId)

        print "currentStep: " + str(currentStep)

        flatUuids = []
        for uuid in imageUuids:
            flatUuids.append(uuid[0])

        attr = {
            "registrationId": registrationId,
            "challengeId": challenge[0],
            "userId": userId,
            "title": challenge[1],
            "desc": challenge[2],
            "countSteps": challenge[3],
            "currentStep": currentStep,
            "imageUuids": flatUuids
        }

        print "Attr: " + str(attr)

        return jsonify({"attributes": attr})

@app.route("/feed/<registrationId>", methods=["GET"])
def getChallengeFeed(registrationId):
    pass

@app.route('/sign_s3/')
def sign_s3():
    AWS_ACCESS_KEY = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    S3_BUCKET = os.environ.get('S3_BUCKET_NAME')

    mimeType = request.args.get('s3_object_type')
    imageUuid = request.args.get('s3_object_name')
    objectName = 'img-%s' % (imageUuid)

    print "Image UUID: " + str(imageUuid)

    expires = long(time.time()+120)
    amzHeaders = "x-amz-acl:public-read"

    putRequest = "PUT\n\n%s\n%d\n%s\n/%s/%s" % (mimeType, expires, amzHeaders, S3_BUCKET, objectName)

    signature = base64.encodestring(hmac.new(AWS_SECRET_KEY, putRequest, sha1).digest())
    signature = urllib.quote_plus(signature.strip())

    url = 'https://%s.s3.amazonaws.com/%s' % (S3_BUCKET, objectName)

    return jsonify({
        'signed_request': '%s?AWSAccessKeyId=%s&Expires=%d&Signature=%s' % (url, AWS_ACCESS_KEY, expires, signature),
        'url': url
    })

@app.route("/image", methods=['POST', 'PUT'])
def createImage():
    # create
    if request.method == 'POST':
        uuid = palate.createImage()
        return jsonify({"attributes": { "uuid": uuid }})    
    # update    
    elif request.method == 'PUT':
        pass

@app.route("/progress", methods=['POST', 'PUT'])
def saveChallengeUserProgress():
    if request.method == 'POST':
        progressModel = request.get_json()

        userId = progressModel['userId']
        challengeId = progressModel['challengeId']
        imageUuid = progressModel['imageUuid']

        palate.saveChallengeUserProgress(userId, challengeId, imageUuid)

        return jsonify({"attributes": progressModel})

def saveImage(userId, imageId):    
    pass

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)
    
