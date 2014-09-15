_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

var Challenge = Backbone.Model.extend({
	title: "",
	desc: ""
});

var ChallengeList = Backbone.Collection.extend({
	model: Challenge,
	url: '/challenges.json',
	parse: function(response) {
		return response.items;
	}
});

var ChallengeListView = Backbone.View.extend({
	challengeRowTemplate: _.template("<a href='#challengeDetails' class='ui-btn'>{{ title }}</a>"),

	initialize: function() {
		this.listenTo(this.collection, "change", this.render);
	},

	render: function() {
		view = this
		_.each(this.collection.models, function(element, index, list) {
			view.$el.append(view.challengeRowTemplate(element.pick('title')))
		});
	}
});