const Storage = {
    getUsers: function() {
        return JSON.parse(localStorage.getItem('isp_users_local')) || [];
    },
    saveUsers: function(usersArray) {
        localStorage.setItem('isp_users_local', JSON.stringify(usersArray));
    },
    getApiSettings: function() {
        return JSON.parse(localStorage.getItem('isp_api_settings')) || { ip: '', port: '', user: '', pass: '' };
    },
    saveApiSettings: function(settingsObject) {
        localStorage.setItem('isp_api_settings', JSON.stringify(settingsObject));
    }
};
