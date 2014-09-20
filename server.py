from flask import Flask
from flask import render_template
from flask import jsonify

import os

app = Flask("palate")

@app.route("/")
def home():
    return render_template('home.html')

@app.route("/details")
def challengeDetails():    
	return render_template('challenge-details.html')

@app.route("/challenges.json")
def getChallenges():
	challenges = []
	challenges.append({"id": 0, "title": "Meatless Mondays", "desc": "Don't eat meat on Mondays", "tags": ["Sustainable", "Fun"], "imageFile": "ch1.jpg"})
	challenges.append({"id": 1, "title": "Farm to Table Meal", "desc": "Cook a Farm to Table dinner", "tags": ["Wacky", "Learn"], "imageFile": "ch2.jpg"})
	
	return jsonify({"items": challenges})    

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)