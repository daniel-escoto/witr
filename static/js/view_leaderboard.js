// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {
  // This is the Vue data.
  app.data = {
    sort_option: "Highest Average",
    rows: [],
  };

  app.enumerate = (a) => {
    // This adds an _idx field to each element of the array.
    let k = 0;
    a.map((e) => {
      e._idx = k++;
    });
    return a;
  };
  app.watch = {
    sort_option: function () {
      if (this.sort_option === "Highest Average") {
        let sortedArray = this.rows.sort(function (a, b) {
          return b.avg - a.avg;
        });
        app.vue.rows = app.enumerate(sortedArray);
        return;
      } else {
        let sortedArray = this.rows.sort(function (a, b) {
          return a.avg - b.avg;
        });
        app.vue.rows = app.enumerate(sortedArray);
        return;
      }
    },
  };
  app.view_profile = function (username) {
    window.location.href = `../view_profile/${username}`;
  };

  app.index = function () {
    window.location.href = `../`;
  };

  // We form the dictionary of all methods, so we can assign them
  // to the Vue app in a single blow.
  app.methods = {
    view_profile: app.view_profile,
    index: app.index,
  };

  // This creates the Vue instance.
  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    watch: app.watch,
    methods: app.methods,
  });

  // And this initializes it.
  // Generally, this will be a network call to the server to
  // load the data.
  // For the moment, we 'load' the data from a string.
  app.init = () => {
    axios.get(load_view_leaderboard).then(function (response) {
      app.vue.rows = app.enumerate(response.data.lrows);
    });
  };

  // Call to the initializer.
  app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);
