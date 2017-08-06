var services =angular.module(
	"radagast-app.services",
 	['ngResource']
 	);
var controllers =angular.module(
	"radagast-app.controllers",
 	[]);
var directives =angular.module(
	'radagast-app.directives',
 	[])

angular
  .module('radagast-app',
  	[
  	'radagast-app.services',
  	'radagast-app.directives',
  	'radagast-app.controllers',
  	])