//
// configuration
//
_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

var Palate = {
	init: function() {
		var me = this;
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
	},

	main: function() {
		this.init();

		var me = this;

		var challenges = new this.ChallengeList();
		challenges.fetch({"async": false});

		var challengesView = new this.ChallengeListView({collection: challenges});
		challengesView.render();

		$("#challengeView").on("pagebeforecreate", function() {
			var challengeView = new me.ChallengeView({model: me.ListToDetail.modelClicked});
			challengeView.render();			
		});
	}
};