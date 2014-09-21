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
			imageFile: ""
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

		this.detailTmp = _.template("<p>{ desc }</p>");

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
						title: attr.title,
						imageUrl: 'data/img/' + attr.imageFile,
						tags: tagsHtml
					};

					var row = me.challengeItemTmp(data);
					var $row = $(row);

					$row.bind("click", function(event) {
						me.ListToDetail.modelClicked = element;
					});

					view.$el.append($row);
				});
			}
		});

		this.ChallengeView = Backbone.View.extend({

			el: document.querySelector("#challengeCont"),

			initialize: function() {
				this.listenTo(this.model, "change", this.render);
			},

			render: function() {
				this.$el.html(me.detailTmp(this.model.pick("desc")));
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