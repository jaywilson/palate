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

    def getChallenges(self):
        return self.query("select c.id, c.title, c.description, i.uuid from challenge c join image i on i.id = c.imageId;")

    def getUserChallenges(self, userId):
        return self.query("select c.id, c.title, c.description, c.countSteps from challengeRegistration r join challenge c on c.id = r.challengeId where r.userId = %s;" % (userId))    

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

    def getRegistration(self, registrationId):
        results = self.query("select challengeId, userId from challengeRegistration where registrationId = %s" % (registrationId))    
        return results[0]

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