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

	// caption
	this.captionTmp = _.template(document.querySelector("#captionTmp").innerHTML);
	this.challengeCheckListTmp = _.template(document.querySelector("#challengeCheckListTmp").innerHTML);

	$("#templates").remove();

	// ****************
	// CHALLENGE LIST *
	// ****************
	this.Challenge = Backbone.Model.extend({
		id: 0,
		title: "",
		desc: "",
		tags: [],
		imageUuid: ""
	});

	this.ChallengeList = Backbone.Collection.extend({
		model: me.Challenge,
		url: "/challengeList",
		parse: function(response) {
			return response.items;
		}
	});

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

				console.log(attr.isRegistered);
				var pageName = attr.regId == 0 ? "challengeHome" : "challengeFeedPage";

				var data = {
					id: attr.id,
					title: attr.title,
					imageUrl: me.imgRoot + attr.imageUuid,
					tags: tagsHtml,
					pageName: pageName
				};

				var row = me.challengeItemTmp(data);
				view.$el.append(row);
				view.$el.trigger('create');

				$("#coverImageLink" + attr.id).bind("click", function(event) {
					me.pageModel = attr.regId == 0 ? model : {id: attr.regId};
				});
			});
		}
	});

	// ****************
	// CHALLENGE HOME *
	// ****************
	this.ChallengeHome = this.Challenge.extend({
		urlRoot: "/home",
		images: [],
		userCount: 0,
		parse: function(response) {
			return response.attributes
		}
	});

	this.ChallengeHomeView = Backbone.View.extend({

		el: document.querySelector("#challengeHomeCont"),

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
				me.pageModel = view.model;
			});
		}
	});

	// ****************
	// CHALLENGE FEED *
	// ****************
	this.ChallengeUserProgress = Backbone.Model.extend({
		urlRoot: "/progress",
		challengeId: 0,
		userId: 0,
		imageUuid: ""
	});

	this.ChallengeFeed = Backbone.Model.extend({
		urlRoot: "/feed",
		registrationId: 0,
		challengeId: 0,
		title: "",
		desc: "",
		countSteps: 0,
		currentStep: 0,
		imageUuids: [],
		parse: function(response) {
			return response.attributes;
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
				regId: attr.registrationId
			};

			// populate jquery content container
			this.$el.html(me.challengeFeedTmp(data));
			// enhance template elements
			this.$el.trigger('create');

			
			$("#feedTitle").html(attr.title);

			var view = this;

			// set up tab content events after enhanced elements created
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

	// *********
	// CAPTION *
	// *********
	
	this.UserChallenges = Backbone.Collection.extend({
		model: me.Challenge,
		url: "/userChallenges",
		parse: function(response) {
			return response.items;
		}
	});

	this.CaptionView = Backbone.View.extend({
		el: document.querySelector("#captionCont"),
		imageUuid: "",
		regId: 0,

		render: function() {
			var listHtml = this.renderUserChallenges(this.collection.models);

			var data = {
				imageUrl: me.imgRoot + this.imageUuid,
				userChallengeList: listHtml
			};

			this.$el.html(me.captionTmp(data));
			this.$el.trigger('create');

			$("#postImage").on("click", function() {
				me.goTo("challengeFeedPage", {id: this.regId});
			});

			me.s3Upload(this.imageUuid);    
		},

		renderUserChallenges: function(userChallenges) {
			var html = "";
			_.each(userChallenges, function(model, i) {
				var attr = model.attributes;
				html += me.challengeCheckListTmp({checkBoxId: "userListCheck" + attr.id, title: attr.title});
			});
			return html;
		}
	});

	this.pageModel = {};
	me.username = "Anonymous";

	//
	// methods
	//

	var imageTmp = _.template('<img src="{ url }" class="challengeImage" id="captionImage" style="width: 100px;"/>');
	var statusTmp = '<p id="imageUploadStatus">';

	this.s3Upload = function(imageUuid) {
        var preview_elem = document.getElementById("imagePreview");
		
		preview_elem.innerHTML = statusTmp;
		var status_elem = document.getElementById("imageUploadStatus");

        var s3upload = new S3Upload({
            file_dom_selector: 'file',
            s3_sign_put_url: '/sign_s3/',
            s3_object_name: imageUuid,

            onProgress: function(percent, message) {
                status_elem.innerHTML = 'Uploading (' + percent + '% ' + message + ')';
            },

            onFinishS3Put: function(url) {
            	console.log(url);
                preview_elem.innerHTML = imageTmp({url: url});
            },

            onError: function(status) {
                status_elem.innerHTML = 'Upload error: ' + status;
            }
        });    
    };

    this.completeStep = function() {
        var regId = parseInt(document.querySelector("#feedRegId").value);

        var image = new palate.Image();
        image.save();
        image.on('sync', function() {
            me.goTo("captionPage", {uuid: image.uuid, regId: regId});
        });
    };

    this.postProgress = function() {
		var challengeId = parseInt(document.querySelector("#feedChallengeId").value);
        var currentStepSequence = parseInt(document.querySelector("#challengeProgress").value);

    	var progress = new palate.ChallengeUserProgress({
            userId: 0,
            challengeId: challengeId,
            currentStepSequence: currentStepSequence,
            imageUuid: imageUuid
        });
        progress.save();
    };

    this.goTo = function(pageName, model) {
    	me.pageModel = model;
    	$( ":mobile-pagecontainer" ).pagecontainer("change", "#" + pageName);
    }

    this.login = function(username) {
    	me.username = username;
    }

    this.logout = function() {
    	me.username = "Anonymous";
    }

	this.main = function() {
		/*
		This sets up the page transitions.  

		For each page, create a collection or model and attach it to a view
		Then call view.render()

		Each view uses templates to build html, and then calls _.template()
		and puts the result in $el.html()

		Then it calls $el.trigger('create').  This is necessary because html
		generated from the template will use JQuery mobile's high-level
		markup, which needs to be enhanced dynamically.
		*/

		$(document).on("pagebeforeshow", "#loginPage", function(event) {
			$("#loginSubmit").on("click", function(clickEvent) {
				var usr = $("#username").val();
				var pw = $("#password").val();

				var data = {username: usr, password: pw};

				$.ajax({
		            url: "/login",
		            type: "POST",
		            data: JSON.stringify(data),
		            async: true,
		            contentType: "application/json",
    			    dataType: "json",
		            success: function (result) {
		                if(result.success === true) {
		            		me.login(result.username);
		                	me.goTo("challengeListPage", {});
		            	} else {
		                	alert("Wrong Username/Email and password combination");
		                	me.goTo("homePage", {});
		            	}
		          	},
		          	error: function (request,error) {
		            	alert('Network error has occurred please try again!'+error);
		          	},
		        });
			});
		});

		$(document).on("pagebeforeshow", "#challengeListPage", function(event) {
			var challenges = new me.ChallengeList();
			challenges.fetch({"async": false});

			var challengesView = new me.ChallengeListView({collection: challenges});
			challengesView.render();	
		});		

		$(document).on('pagebeforeshow', '#challengeFeedPage', function(event, ui) {
			// check for transition from challenge home; indicates feed should be created
			if (ui.prevPage[0].id === "challengeHome") {
				var attr = me.pageModel.attributes;
				var feed = new me.ChallengeFeed({
					id: 0,
					userId: 0, 
					challengeId: attr.id
				});

				feed.save();
			} else {
				// page model is a Feed
				var feed = new me.ChallengeFeed({id: me.pageModel.id});
				feed.fetch({"async": false});	
			}

			var view = new me.ChallengeFeedView({model: feed});
			view.render();
		});

		$(document).on('pagebeforeshow', '#challengeHome', function() {
			attr = me.pageModel.attributes;
			home = new me.ChallengeHome({id: attr.id});
			home.fetch({"async": false});

			var view = new me.ChallengeHomeView({model: home});
			view.render();
		});

		$(document).on('pagebeforeshow', '#captionPage', function() {
			attr = me.pageModel;

			var userChallenges = new me.UserChallenges();
			userChallenges.fetch({async: false});

			var view = new me.CaptionView({collection: userChallenges});
			view.imageUuid = attr.uuid;
			view.regId = attr.regId;
			view.render();
		});
	}
};