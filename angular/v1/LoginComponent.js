'use strict';

module.exports = {
    templateUrl: 'view/login.html',
    controller: function ($http, API_URL, AuthenticationService, Authorization) {
        var viewModel = this;

        viewModel.form;
        viewModel.dataLoading = false;
        viewModel.username = '';
        viewModel.password = '';
        viewModel.error = '';

        viewModel.login = login;

        // Upon navigating to this page, make sure the user is logged out.
        AuthenticationService.clearCredentials();

        // The AuthHttpResponseInterceptor will set login status based on the response.
        function login() {
            viewModel.dataLoading = true;

            var config = {
                headers: {
                    Authorization: 'Basic ' + window.btoa(viewModel.username + ':' + viewModel.password)
                }
            };

            $http.post(API_URL + '/login/', null, config).then(function (success) {
                AuthenticationService.setCredentials(viewModel.username, success.data.data);

                Authorization.reloadUser().then(function (success) {
                    viewModel.dataLoading = false;
                });
            }, function (failure) {
                viewModel.dataLoading = false;
                viewModel.error = 'Invalid Credentials';
            });
        };
    }
};
