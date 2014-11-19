from flask import Flask
from flask_login import LoginManager, login_user, login_required, current_user, AnonymousUserMixin
from flask import render_template, jsonify, request, redirect
from hashlib import sha1

from palate import Palate, LoginAttempt

import os
import time, base64, hmac, urllib, uuid

app = Flask(__name__, static_folder="data")
app.secret_key = 'eioughie3984'

loginManager = LoginManager()
loginManager.init_app(app)

palate = Palate()
palate.createSchema()
palate.insertData()

@loginManager.user_loader
def load_user(username):
    user = palate.getUser(username)
    if user is None:
        return None
    else:
        return LoginAttempt(user, True)

def getUserId():
    return current_user.id        

@app.route("/login", methods=["GET", "POST"])
def login():
    loginData = request.get_json()
    print("loginData: " + str(loginData))
    user = palate.getUser(loginData[unicode('username')])
    print("user: " + str(user))
    loginAttempt = palate.tryLogin(user['name'], str(loginData[unicode('password')]))
    print("loginAttempt: " + str(loginAttempt))

    success = login_user(loginAttempt)
    return jsonify({"success": success})

@app.route("/")
def home():
    return render_template('home.html')

@app.route("/challengeList")
@login_required
def getChallengeList():
    userId = getUserId()
    userChallenges = palate.getUserChallenges(userId)
    recChallenges = palate.getRecommendedChallenges(userId)

    items = []
    for ch in allChallenges:
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

@app.route("/userChallenges")
@login_required
def getUserChallenges(userId):
    userId = getUserId()
    dbChallenges = palate.getUserChallenges(userId)

    items = []
    for ch in dbChallenges:
        items.append({
            "id": ch[0],
            "title": ch[1],
            "desc": ch[2]
        })

    return jsonify({"items": items})    


@app.route("/home/<challengeId>")
@login_required
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

@app.route("/feed", methods=["POST"])
@login_required
def saveChallengeFeed():
    userId = current_user.id
    feedModel = request.get_json()

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

@app.route('/sign_s3/')
def sign_s3():
    AWS_ACCESS_KEY = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    S3_BUCKET = os.environ.get('S3_BUCKET_NAME')

    mimeType = request.args.get('s3_object_type')
    imageUuid = request.args.get('s3_object_name')
    objectName = 'img-%s' % (imageUuid)

    print "Image UUID: " + str(imageUuid)

    # signature lasts for 10 sec
    expires = long(time.time() + 10)
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
        currentStepSequence = progressModel['currentStepSequence']
        imageUuid = progressModel['imageUuid']

        completedStepSequence = currentStepSequence + 1

        palate.saveChallengeUserProgress(userId, challengeId, imageUuid)
        palate.updateCurrentStep(userId, challengeId, completedStepSequence)

        return jsonify({"attributes": progressModel})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)
    
