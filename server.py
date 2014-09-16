from flask import Flask
from flask import render_template
from flask import jsonify

import os

app = Flask("palate")

@app.route("/")
def hello():
    return render_template('home.html')

@app.route("/challenges.json")
def getChallenges():
	challenges = []
	challenges.append({"title": "Meatless Mondays", "desc": "Don't eat meat on Mondays"})
	challenges.append({"title": "Farm to Table Meal", "desc": "Cook a Farm to Table dinner"})
	
	return jsonify({"items": challenges})    

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)