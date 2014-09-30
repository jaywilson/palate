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

		this.imgPath = "data/img/";
		
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
			countPeople: 0,
			totalPics: 0,
			donePics: 0
		});

		this.ChallengeList = Backbone.Collection.extend({
			model: me.Challenge,
			url: "/challenges.json",
			parse: function(response) {
				return response.items;
			}
		});

		this.Pic = Backbone.Model.extend({
			fileName: ""
		});

		this.PicList = Backbone.Collection.extend({
			model: me.Pic,
			url: "/pics/<filter>/<id>/pics.json",
			parse: function(response) {
				return response.items;
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
						imageUrl: 'data/img/' + attr.coverImageFile,
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
				tileHtml += me.challengeTileImgTmp({imageUrl: me.imgPath + attr.detailImageFiles[0], blockIndex: 'b'});
				// count people
				tileHtml += me.challengeTileTextTmp({text: attr.countPeople + " people", blockIndex: 'c'});

				// img2
				tileHtml += me.challengeTileImgTmp({imageUrl: me.imgPath + attr.detailImageFiles[1], blockIndex: 'a'});
				// img3
				tileHtml += me.challengeTileImgTmp({imageUrl: me.imgPath + attr.detailImageFiles[2], blockIndex: 'b'});
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
					totalPics: attr.totalPics,
					donePics: attr.donePics,
					content: content
				};

				this.$el.html(me.challengeFeedTmp(data));
				this.$el.trigger('create');

				$("#feedTitle").html(attr.title);

				var view = this;

				$("#firstTabLink").on("click", function() {
					console.log("here");
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
				var picList = new me.PicList();
				picList.url = "/pics/all/" + attr.id + "/pics.json";
				picList.fetch({async: false});

				var tileHtml = "";
				
				_.each(_.range(4), function() {
					var c = 0;
					_.each(['a', 'b', 'c'], function(el) {
						tileHtml += me.challengeTileImgTmp({imageUrl: me.imgPath + attr.detailImageFiles[c], blockIndex: el});	
						c += 1;
					});
				});

				return me.tilesTmp({tiles: tileHtml});
			},

			renderSecondTab: function(attr) {
				return "Second!";
			},

			renderThirdTab: function(attr) {
				return "Third!";
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

		$(document).on("pagebeforeshow", "#challengeListPage", function(event) {
			var challenges = new me.ChallengeList();
			challenges.fetch({"async": false});

			var challengesView = new me.ChallengeListView({collection: challenges});
			challengesView.render();	
		});		

		$(document).on('pagebeforeshow', '#challengeFeedPage', function() {
			var view = new me.ChallengeFeedView({model: me.ListToDetail.modelClicked});
			view.render();
		});

		$(document).on('pagebeforeshow', '#challengePage', function() {
			var challengeView = new me.ChallengeView({model: me.ListToDetail.modelClicked});
			challengeView.render();
		});
	}
};