(function() {

    angular.module("radagast-app.controllers")
        .controller("FacebookController", facebook);
    facebook.$inject = ["$scope", "$rootScope","$http","$window"];
    
    function facebook($scope, $rootScope, $http,$window){
    	var vm = this;
    	vm.loginToFacebook = loginToFacebook;
    	vm.subscription = subscription;
    	vm.pages = [];
        function loginToFacebook(){
        	console.log("asdf")
        	login()
        	.then(getPages)
        	.then(function(pages){
        		vm.pages = pages;
        	}).catch(function(err){
        		console.error(err)
        	})
        }
        function login(){
            return new Promise(function(resolve,reject){
                FB.login(function(response){
                    if (response.error){
                        reject(response.error);
                    }
                    resolve(response.authResponse.accessToken);
                }, {scope: ['manage_pages','pages_messaging']});
            });
        }
        function subscription(page){
        	subscribeToMessaging(page.access_token,page.id)
        	.then(function(result){
        		return $http.post('https://e116c75c.ngrok.io/add-page', page, {})
        	}).then(function(result){
        		$window.alert("Página conectada com sucesso.")
        	}).catch(function(err){
        		$window.alert("Ocorreu um erro.")
        	})
        }
        function getPages(tokena){
            var token = tokena;
            vm.access_token = tokena;
            return new Promise(function(resolve,reject){
                FB.api('/me/accounts', {
                    access_token: token
                }, function(response){
                    if(response.error){
                        reject(response.error);
                    }
                    resolve(response.data);
                });
            });
        }
        function subscribeToMessaging(access_token,page_id){
            return new Promise(function(resolve,reject){
               FB.api(page_id + '/subscribed_apps', 'POST', {
                access_token: access_token,
                },function(response) {
                    if(response.error){
                        reject(response.error);
                    }
                    resolve(true);
                });
            });
        }

    }
})()
