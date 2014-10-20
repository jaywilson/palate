function Palate() {
	var me = this;

	//
	// configuration
	//
	// override to interpolate {}
	_.templateSettings = {
		interpolate: /\{(.+?)\}/g
	};

	this.imgRoot = "http://s3.amazonaws.com/palate-prototype/img-"
	
	// 
	// models
	//
	this.Challenge = Backbone.Model.extend({
		id: 0,
		title: "",
		desc: "",
		tags: [],
		imageUuid: ""
	});

	this.Challenges = Backbone.Collection.extend({
		model: me.Challenge,
		url: "/challenges",
		parse: function(response) {
			return response.items;
		}
	});

	this.ChallengeHome = this.Challenge.extend({
		urlRoot: "/home",
		images: [],
		userCount: 0,
		parse: function(response) {
			return response.attributes
		}
	});

	this.ChallengeFeed = Backbone.Model.extend({
		urlRoot: "/feed",
		registrationId: 0,
		challengeId: 0,
		userId: 0,
		title: "",
		desc: "",
		countSteps: 0,
		currentStep: 0,
		imageUuids: [],
		parse: function(response) {
			return response.attributes;
		}
	});

	this.ChallengeUserProgress = Backbone.Model.extend({
		urlRoot: "/progress",
		challengeId: 0,
		userId: 0,
		imageUuid: ""
	});

	this.Image = Backbone.Model.extend({
		urlRoot: "/image",
		id: 0,
		uuid: "",
		status: 0,
		parse: function(response) {
			return response.attributes;
		}
	});

	//
	// templates
	//
	// challenge list
	this.challengeItemTmp = _.template(document.querySelector("#challengeItemTmp").innerHTML);
	this.challengeItemTagsTmp = _.template(document.querySelector("#challengeItemTagsTmp").innerHTML);

	// challenge home
	this.challengeTmp = _.template(document.querySelector("#challengeTmp").innerHTML);
	this.challengeTileTextTmp = _.template(document.querySelector("#challengeTileTextTmp").innerHTML);
	this.challengeTileImgTmp = _.template(document.querySelector("#challengeTileImgTmp").innerHTML);

	// challenge feed
	this.challengeFeedTmp = _.template(document.querySelector("#challengeFeedTmp").innerHTML);

	// general
	// tiles container
	this.tilesTmp = _.template(document.querySelector("#tilesTmp").innerHTML);

	$("#templates").remove();

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
			_.each(this.collection.models, function(model, index, list) {
				var attr = model.attributes;

				var tagsHtml = "";
				_.each(attr.tags, function(elem, i) {
					tagsHtml += me.challengeItemTagsTmp({tagName: elem, bottomPos: i * 40});
				});

				var data = {
					id: attr.id,
					title: attr.title,
					imageUrl: me.imgRoot + attr.imageUuid,
					tags: tagsHtml
				};

				var row = me.challengeItemTmp(data);
				view.$el.append(row);

				$("#coverImageLink" + attr.id).bind("click", function(event) {
					me.ListToDetail.modelClicked = model;
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

			var tileHtml = "";

			// rules
			tileHtml += me.challengeTileTextTmp({text: 'Rules', blockIndex: 'a'});
			// img1
			tileHtml += me.challengeTileImgTmp({imageUrl: me.imgRoot + attr.imageUuids[0], blockIndex: 'b'});
			// count people
			tileHtml += me.challengeTileTextTmp({text: attr.userCount + " people", blockIndex: 'c'});

			// img2
			tileHtml += me.challengeTileImgTmp({imageUrl: me.imgRoot + attr.imageUuids[1], blockIndex: 'a'});
			// img3
			tileHtml += me.challengeTileImgTmp({imageUrl: me.imgRoot + attr.imageUuids[2], blockIndex: 'b'});
			// recipes
			tileHtml += me.challengeTileTextTmp({text: "Recipes", blockIndex: 'c'});

			var content = me.tilesTmp({tiles: tileHtml});

			var data = {
				title: attr.title,
				desc: attr.desc,
				content: content
			};

			this.$el.html(me.challengeTmp(data));
			this.$el.trigger('create');

			var view = this;

			$("#challengeFeedLink").on("click", function() {
				me.ListToDetail.modelClicked = view.model;
			});
		}
	});

	this.ChallengeFeedView = Backbone.View.extend({
		el: document.querySelector("#challengeFeedCont"),

		initialize: function() {
			this.listenTo(this.model, "change", this.render);
		},

		render: function() {
			var attr = this.model.attributes;

			var content = this.renderFirstTab(attr);

			var data = {
				countSteps: attr.countSteps,
				currentStep: attr.currentStep,
				content: content,
				challengeId: attr.challengeId,
				userId: 0
			};

			this.$el.html(me.challengeFeedTmp(data));
			this.$el.trigger('create');

			$("#feedTitle").html(attr.title);

			var view = this;

			$("#firstTabLink").on("click", function() {
				$("#firstTab").html(view.renderFirstTab(attr));
			});

			
			$("#secondTabLink").on("click", function() {
				$("#secondTab").html(view.renderSecondTab(attr));
			});

			$("#thirdTabLink").on("click", function() {
				$("#thirdTab").html(view.renderThirdTab(attr));
			});
		},

		renderFirstTab: function(attr) {
			return this.renderImages(attr, 'all');
		},

		renderSecondTab: function(attr) {
			return this.renderImages(attr, 'group');
		},

		renderThirdTab: function(attr) {
			return this.renderImages(attr, 'both');
		},

		renderImages: function(attr, filter) {
			var tileHtml = "";
			
			blocks = ['a', 'b', 'c']
			_.each(attr.imageUuids, function(uuid, i) {
				tileHtml += me.challengeTileImgTmp({imageUrl: me.imgRoot + uuid, blockIndex: blocks[i % 3]});
			});

			return me.tilesTmp({tiles: tileHtml});
		}
	});

	//
	// transitions
	//
	this.ListToDetail = {
		modelClicked: {}
	};

	this.main = function() {
		var me = this;

		$(document).on("pagebeforeshow", "#challengeListPage", function(event) {
			var challenges = new me.Challenges();
			challenges.fetch({"async": false});

			var challengesView = new me.ChallengeListView({collection: challenges});
			challengesView.render();	
		});		

		$(document).on('pagebeforeshow', '#challengeFeedPage', function(event, ui) {
			var attr = me.ListToDetail.modelClicked.attributes;

			// check for transition from challenge home; indicates feed should be created
			if (ui.prevPage[0].id === "challengeHome") {
				var feed = new me.ChallengeFeed({
					userId: 0, 
					challengeId: attr.id
				});

				feed.save();
			} else {
				var feed = new me.ChallengeFeed({id: attr.id});
				feed.fetch({"async": false});	
			}

			var view = new me.ChallengeFeedView({model: feed});
			view.render();
		});

		$(document).on('pagebeforeshow', '#challengeHome', function() {
			attr = me.ListToDetail.modelClicked.attributes;
			home = new me.ChallengeHome({id: attr.id});
			home.fetch({"async": false});

			var challengeView = new me.ChallengeView({model: home});
			challengeView.render();
		});
	}
};