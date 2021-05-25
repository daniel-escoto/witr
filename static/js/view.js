let app = {};

let init = (app) => {
  app.data = {
    username: "",
    full_name: "",
  };
  app.methods = {};

  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    methods: app.methods,
  });

  app.init = () => {
    axios.get(load_user_info_url).then(function (response) {
      app.vue.username = response.data.username;
      app.vue.full_name = response.data.full_name;
    });
  };
  app.init();
};

init(app);
