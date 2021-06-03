// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

let init = (app) => {
  app.data = {
    sort_option: "",
    add_content: "",
    rows: [],
    email: "",
  };
  app.watch = {
    sort_option: function () {
      console.log(app.vue.rows);
      if (this.sort_option === "Most Upvotes") {
        let sortedArray = this.rows.sort(function (a, b) {
          let a_net_thumbs_up = a.thumbs_up.length - a.thumbs_down.length;
          let b_net_thumbs_up = b.thumbs_up.length - b.thumbs_down.length;

          return b_net_thumbs_up - a_net_thumbs_up;
        });
        app.vue.rows = app.enumerate(sortedArray);
        return;
      } else if (this.sort_option === "Most Downvotes") {
        let sortedArray = this.rows.sort(function (a, b) {
          let a_net_thumbs_down = a.thumbs_down.length - a.thumbs_up.length;
          let b_net_thumbs_down = b.thumbs_down.length - b.thumbs_up.length;

          return b_net_thumbs_down - a_net_thumbs_down;
        });
        app.vue.rows = app.enumerate(sortedArray);
        return;
      } else if (this.sort_option === "Most Votes") {
        let sortedArray = this.rows.sort(function (a, b) {
          let a_vote_count = a.thumbs_up.length + a.thumbs_down.length;
          let b_vote_count = b.thumbs_up.length + b.thumbs_down.length;

          return b_vote_count - a_vote_count;
        });
        app.vue.rows = app.enumerate(sortedArray);
        return;
      } else if (this.sort_option === "Most Controversial") {
        let sortedArray = this.rows.sort(function (a, b) {
          let a_vote_diff = Math.abs(a.thumbs_up.length - a.thumbs_down.length);
          let b_vote_diff = Math.abs(b.thumbs_up.length - b.thumbs_down.length);

          return a_vote_diff - b_vote_diff;
        });
        app.vue.rows = app.enumerate(sortedArray);
        return;
      } else {
        // let sortedArray = this.rows.slice().reverse();
        let sortedArray = this.rows.sort(function (a, b) {
          if (a.datetime < b.datetime) {
            return 1;
          } else if (a.datetime > b.datetime) {
            return -1;
          } else {
            return 0;
          }
        });
        app.vue.rows = app.enumerate(sortedArray);
        return;
      }
    },
  };

  app.enumerate = (a) => {
    // This adds an _idx field to each element of the array.
    let k = 0;
    a.map((e) => {
      e._idx = k++;
    });
    console.log(a);
    return a;
  };

  app.view_profile = function (username) {
    window.location.href = `../view_profile/${username}`;
  };

  app.methods = {
    view_profile: app.view_profile,
  };

  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    watch: app.watch,
    methods: app.methods,
  });

  app.init = () => {};

  app.init();
};

init(app);
