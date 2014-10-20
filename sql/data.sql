delete from image;
delete from usr;
delete from challenge;
delete from challengeTag;
delete from challengeStep;
delete from challengeUserProgress;

insert into image (uuid, status) values ('cc4b8371-d461-4b30-b4bf-28fd200a1145', 1);
insert into image (uuid, status) values ('45cb649a-559d-4399-b2a5-47a165f4a75e', 1);
insert into image (uuid, status) values ('2140eb97-7cf9-41f9-b258-736f914a715b', 1);

insert into usr (id, name, password) values (0, 'jay', 'snap');
insert into usr (id, name, password) values (1, 'sarah', 'cute');

insert into challenge (id, title, description, imageId, countSteps) values (0, 'Meatless Mondays', 'Dont eat meat on Mondays', 1, 2);
insert into challengeTag (id, challengeId, title) values (0, 0, 'Sustainable');
insert into challengeTag (id, challengeId, title) values (1, 0, 'Fun');
insert into challengeStep (id, challengeId, title, sequence) values (0, 0, 'Part 1', 1);
insert into challengeStep (id, challengeId, title, sequence) values (1, 0, 'Part 2', 2);

insert into challenge (id, title, description, imageId, countSteps) values (1, 'Farm to Table Meal', 'Cook a farm-to-table dinner', 2, 2);
insert into challengeTag (id, challengeId, title) values (2, 1, 'Wacky');
insert into challengeTag (id, challengeId, title) values (3, 1, 'Learn');
insert into challengeStep (id, challengeId, title, sequence) values (2, 1, 'Part 1', 1);
insert into challengeStep (id, challengeId, title, sequence) values (3, 1, 'Part 2', 2);

insert into challengeUserProgress(id, userId, challengeId, stepId, imageId) values (0, 0, 0, 0, 2);