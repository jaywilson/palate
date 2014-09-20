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
			interpolate: /\{\{(.+?)\}\}/g
		};
		
		// 
		// models
		//
		this.Challenge = Backbone.Model.extend({
			id: 0,
			title: "",
			desc: ""
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
		this.listElementTmp = _.template("<a href='#challengeView' class='ui-btn'>{{ title }}</a>");
		this.detailTmp = _.template("<p>{{ desc }}</p>");

		//
		// views
		//
		this.ChallengeListView = Backbone.View.extend({

			el: document.getElementById("challengeListCont"),

			initialize: function() {
				this.listenTo(this.collection, "change", this.render);
			},

			render: function() {
				var view = this;
				_.each(this.collection.models, function(element, index, list) {
					var row = me.listElementTmp(element.pick("title"));
					var $row = $(row);

					$row.bind("click", function(event) {
						me.ListToDetail.modelClicked = element;
					});

					view.$el.append($row);
				});
			}
		});

		this.ChallengeView = Backbone.View.extend({

			el: document.getElementById("challengeCont"),

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
			$("#debug").html(event.target.files.length + " " + event.target.files[0].type.indexOf("image/") + " " + URL);
			if (event.target.files.length == 1 && event.target.files[0].type.indexOf("image/") == 0) {
            	$("#cameraImage").attr("src", URL.createObjectURL(event.target.files[0]));
        	}
		});
	},

	main: function() {
		this.init();

		var me = this;

		var challenges = new this.ChallengeList();
		challenges.fetch({"async": false});

		var challengesView = new this.ChallengeListView({collection: challenges});
		challengesView.render();

		$("body").on( "pagecontainerbeforeshow", function( event, ui ) {
			if (ui.prevPage[0].id == "challengeListView" && ui.toPage[0].id == "challengeView") {
				var challengeView = new me.ChallengeView({model: me.ListToDetail.modelClicked});
				challengeView.render();
			}
		});
	}
};