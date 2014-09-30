from flask import Flask
from flask import render_template
from flask import jsonify

import os

app = Flask("palate", static_folder="data")

challengePics = [["ch3.JPG", "ch4.JPG", "ch5.JPG"], ["ch6.JPG", "ch7.JPG", "ch8.JPG"]]

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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)