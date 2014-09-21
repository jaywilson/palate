var Palate = {
	init: function() {
		var me = this;

		//
		// configuration
		//
		if (!("url" in window) && ("webkitURL" in window)) {
            window.URL = window.webkitURL;   
        }

		_.templateSettings = {
			interpolate: /\{(.+?)\}/g
		};
		
		// 
		// models
		//
		this.Challenge = Backbone.Model.extend({
			id: 0,
			title: "",
			desc: "",
			tags: [],
			coverImageFile: "",
			detailImageFiles: [],
			countPeople: 0
		});

		this.ChallengeList = Backbone.Collection.extend({
			model: me.Challenge,
			url: "/challenges.json",
			parse: function(response) {
				return response.items;
			}
		});

		//
		// templates
		//
		this.challengeItemTmp = _.template(document.querySelector("#challengeItemTmp").innerHTML);
		this.challengeItemTagsTmp = _.template(document.querySelector("#challengeItemTagsTmp").innerHTML);

		this.challengeTmp = _.template(document.querySelector("#challengeTmp").innerHTML);
		this.challengeTileTextTmp = _.template(document.querySelector("#challengeTileTextTmp").innerHTML);
		this.challengeTileImgTmp = _.template(document.querySelector("#challengeTileImgTmp").innerHTML);

		//
		// views
		//
		this.ChallengeListView = Backbone.View.extend({

			el: document.querySelector("#challengeListCont"),

			initialize: function() {
				this.listenTo(this.collection, "change", this.render);
			},

			render: function() {
				this.$el.html("");
				var view = this;
				_.each(this.collection.models, function(element, index, list) {
					var attr = element.attributes;

					var tagsHtml = "";
					_.each(attr.tags, function(elem, i) {
						tagsHtml += me.challengeItemTagsTmp({tagName: elem, bottomPos: i * 40});
					});

					var data = {
						id: attr.id,
						title: attr.title,
						imageUrl: 'data/img/' + attr.coverImageFile,
						tags: tagsHtml
					};

					var row = me.challengeItemTmp(data);
					view.$el.append(row);

					$("#coverImageLink" + attr.id).bind("click", function(event) {
						me.ListToDetail.modelClicked = element;
					});
				});
			}
		});

		this.ChallengeView = Backbone.View.extend({

			el: document.querySelector("#challengeCont"),

			initialize: function() {
				this.listenTo(this.model, "change", this.render);
			},

			render: function() {
				var attr = this.model.attributes;

				var imgPath = "data/img/";

				var tileHtml = "";

				// rules
				tileHtml += me.challengeTileTextTmp({text: 'Rules', blockIndex: 'a'});
				// img1
				tileHtml += me.challengeTileImgTmp({imageUrl: imgPath + attr.detailImageFiles[0], blockIndex: 'b'});
				// count people
				tileHtml += me.challengeTileTextTmp({text: attr.countPeople + " people", blockIndex: 'c'});

				// img2
				tileHtml += me.challengeTileImgTmp({imageUrl: imgPath + attr.detailImageFiles[1], blockIndex: 'a'});
				// img3
				tileHtml += me.challengeTileImgTmp({imageUrl: imgPath + attr.detailImageFiles[2], blockIndex: 'b'});
				// recipes
				tileHtml += me.challengeTileTextTmp({text: "Recipes", blockIndex: 'c'});

				var data = {
					title: attr.title,
					desc: attr.desc,
					tiles: tileHtml
				}

				this.$el.html(me.challengeTmp(data));
			}
		});

		//
		// transitions
		//
		this.ListToDetail = {
			modelClicked: {}
		};

		//
		// take pictures
		//
		$("#takePictureField").on("change", function(event) {
			if (event.target.files.length == 1 && event.target.files[0].type.indexOf("image/") == 0) {
				var imageFile = event.target.files[0];
				var imageURL = URL.createObjectURL(imageFile);
            	$("#cameraImage").attr("src", imageURL);
        	}
		});
	},

	main: function() {
		this.init();

		var me = this;

		$("body").on( "pagecontainerbeforeshow", function( event, ui ) {
			var prevId = ui.prevPage[0].id;
			var toId = ui.toPage[0].id;

			if (prevId == "challengeListPage" && toId == "challengePage") {
				var challengeView = new me.ChallengeView({model: me.ListToDetail.modelClicked});
				challengeView.render();
			} else if (prevId == "loginPage" && toId == "challengeListPage") {
				var challenges = new me.ChallengeList();
				challenges.fetch({"async": false});

				var challengesView = new me.ChallengeListView({collection: challenges});
				challengesView.render();
			}
		});
	}
};