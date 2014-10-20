drop table if exists image;
create table image (
   id 		    serial 		primary key     not null,
   uuid         uuid    					not null,
   status		int							not null
);

drop table if exists usr;
create table usr (
	id 			int			primary key		not null,
	name		text						not null,
	password	text						not null
);

drop table if exists challenge;
create table challenge (
	id       		int		primary key		not null,
	title			text					not null,
	description 	text					not null,
	imageId			int,
	countSteps		int						not null
);

drop table if exists challengeTag;
create table challengeTag (
	id  		int			primary key		not null,
	title		text						not null,
	challengeId	int							not null
);

drop table if exists challengeStep;
create table challengeStep (
	id          int			primary key 	not null,
	challengeId int							not null,
	title		text						not null,
	sequence	int							not null
);

drop table if exists challengeRegistration;
create table challengeRegistration (
	id 			  serial	primary key		not null,
	challengeId	  int						not null,
	userId		  int						not null,
	currentStepSequence int					not null
);

drop table if exists challengeUserProgress;
create table challengeUserProgress (
	id          serial		primary key 	not null,
	userId		int							not null,
	challengeId int							not null,
	stepId		int							not null,
	imageId		int							not null
);