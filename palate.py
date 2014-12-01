import os, urlparse, uuid
import psycopg2

class Palate:
    def __init__(self):
        urlparse.uses_netloc.append("postgres")
        url = urlparse.urlparse(os.environ["DATABASE_URL"])

        self.conn = psycopg2.connect(
            database=url.path[1:],
            user=url.username,
            password=url.password,
            host=url.hostname,
            port=url.port
        )

    def createSchema(self):
        cur = self.conn.cursor()
        cur.execute(open("sql/palate.sql", "r").read())    
        self.commit(cur)

    def insertData(self):
        cur = self.conn.cursor()
        cur.execute(open("sql/data.sql", "r").read())
        self.commit(cur)

    def getUserByName(self, name):
        result = self.query("select u.id, u.name, u.password from usr u where u.name = '%s';" % (name))    
        if len(result) == 0:
            return None
        else:
            user = result[0]
            return {"id": user[0], "name": user[1], "password": user[2]}

    def getUser(self, id):
        result =  self.query("select u.id, u.name, u.password from usr u where u.id = %s;" % (id))
        if len(result) == 0:
            return None
        else:
            user = result[0]
            return {"id": user[0], "name": user[1], "password": user[2]}

    def getRegistration(self, id):
        return self.query("select id, challengeId, userId, currentStepSequence from challengeRegistration where id = %s;" % (id))        

    def getChallenges(self):
        return self.query("select c.id, c.title, c.description, i.uuid from challenge c join image i on i.id = c.imageId;")

    def getUserChallenges(self, userId):
        return self.query("select c.id, c.title, c.description, c.countSteps, i.uuid, r.id from challengeRegistration r join challenge c on c.id = r.challengeId join image i on i.id = c.imageId where r.userId = %s;" % (userId))    

    def getRecommendedChallenges(self, userId):
        return self.query("select c.id, c.title, c.description, c.countSteps, i.uuid from challenge c join image i on i.id = c.imageId where c.id not in (select distinct challengeId from challengeRegistration where userId = %s);" % (userId))    

    def getChallenge(self, challengeId):
        return self.query("select id, title, description, countSteps from challenge where id = %s;" % (challengeId))    

    def getChallengeUserCount(self, challengeId):
        return self.query("select count(*) from challengeRegistration where challengeId = %s;" % (challengeId))        

    def getChallengeTags(self, challengeId):
        return self.query("select id, title from challengeTag where challengeId = %s;" % (challengeId))  

    def getChallengeImages(self, challengeId):
        return self.query("select uuid from image i join challengeUserProgress p on p.imageId = i.id join challengeStep s on s.id = p.stepId where s.challengeId = %s;" % (challengeId))

    def getCurrentStep(self, userId, challengeId):
        results = self.query("select currentStepSequence from challengeRegistration where userId = %s and challengeId = %s;" % (userId, challengeId))
        return results[0][0]

    def updateCurrentStep(self, userId, challengeId, currentStepSequence):
        self.execute("update challengeRegistration set currentStepSequence = %s where userId = %s and challengeId = %s" % (currentStepSequence, userId, challengeId))

    def createImage(self):
        randomUuid = uuid.uuid4()    
        self.execute("insert into image (uuid, status) values ('%s', 0);" % (randomUuid))   
        return randomUuid   

    def createRegistration(self, userId, challengeId):
        cur = self.conn.cursor()
        cur.execute("insert into challengeRegistration (challengeId, userId, currentStepSequence) values (%s, %s, 0);" % (challengeId, userId))
        results = self.query("select id from challengeRegistration where userId = %s and challengeId = %s" % (userId, challengeId))
        self.commit(cur)
        return results[0][0]

    def saveChallengeUserProgress(self, userId, challengeId, imageUuid):
        cur = self.conn.cursor()        

        cur.execute("select id from image where uuid = '%s';" % (imageUuid))
        imageId = cur.fetchone()[0]

        cur.execute("select s.id from challengeRegistration r join challengeStep s on s.sequence = r.currentstepsequence + 1 and s.challengeId = r.challengeId where s.challengeId = %s;" % (challengeId))
        stepId = cur.fetchone()[0]

        cur.execute("insert into challengeUserProgress (userId, challengeId, stepId, imageId) values (%s, %s, %s, %s);" % (userId, challengeId, stepId, imageId))
        self.commit(cur)

    def tryLogin(self, name, password):
        print("trying login for userId %s" % (name))
        user = self.getUserByName(name)
        if user is None:
            return None
        elif password == user['password']:
            return LoginAttempt(user, True)
        else:
            return LoginAttempt(user, False)    

    def execute(self, sql):
        cur = self.conn.cursor()
        cur.execute(sql)
        self.commit(cur)    

    def query(self, sql):
        cur = self.conn.cursor()
        cur.execute(sql)
        results = cur.fetchall()
        self.commit(cur)            
        return results    

    def commit(self, cur):
        self.conn.commit()
        cur.close()

class LoginAttempt:
    def __init__(self, user, is_authenticated, is_active = True):
        self.id = unicode(user['id'])
        self.authenticated = is_authenticated
        self.active = is_active
        self.anonymous = False

    def get_id(self):
        return self.id

    def is_authenticated(self):
        return self.authenticated

    def is_anonymous(self):
        return False

    def is_active(self):
        return self.active    

    def __str__(self):
        return "id=" + self.id + ",auth=" + str(self.authenticated) + ",active=" + str(self.active)
