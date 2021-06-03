// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

function removeItem(array, item) {
  for (var i in array) {
    if (array[i] == item) {
      array.splice(i, 1);
      break;
    }
  }
}

function ago(v) {
  v = 0 | ((Date.now() - v) / 1e3);
  var a,
    b = {
      second: 60,
      minute: 60,
      hour: 24,
      day: 7,
      week: 4.35,
      month: 12,
      year: 1e4,
    },
    c;
  for (a in b) {
    c = v % b[a];
    if (!(v = 0 | (v / b[a]))) return c + " " + (c - 1 ? a + "s" : a);
  }
}

function pad(n) {
  return n < 10 ? "0" + n : n;
}

// hour:minute AM/PM · Month Day, Year
function displayTimeDate(timeDateString) {
  let date = new Date(timeDateString);
  let hour = date.getHours();
  let minute = date.getMinutes();
  let mid = "AM";

  if (hour > 12) {
    mid = "PM";
    hour -= 12;
  } else if (hour === 0) {
    hour = 12;
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let month = monthNames[date.getMonth()];
  let day = date.getDate();
  let year = date.getFullYear();
  return `${pad(hour)}:${pad(minute)} ${mid} · ${month} ${day}, ${year}`;
}

// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {
  // This is the Vue data.
  app.data = {
    // Complete as you see fit.
    sort_option: "",
    add_mode: false,
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

  // methods
  app.add_post = function () {
    axios
      .post(add_post_url, {
        content: app.vue.add_content,
      })
      .then(function (response) {
        app.vue.rows.push({
          id: response.data.id,
          content: app.vue.add_content,
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          author_email: response.data.email,
          username: response.data.username,
          thumbs_up: response.data.thumbs_up,
          thumbs_down: response.data.thumbs_down,
          datetime: response.data.datetime,
          display_datetime: `${ago(
            new Date(response.data.datetime).getTime()
          )} ago`,
        });
        app.reset_form();
        app.set_add_post(false);
        if (app.vue.sort_option === "Most Recent") {
          app.vue.rows.sort(function (a, b) {
            if (a.datetime < b.datetime) {
              return 1;
            } else if (a.datetime > b.datetime) {
              return -1;
            } else {
              return 0;
            }
          });
        } else {
          app.vue.sort_option = "Most Recent";
        }
        app.enumerate(app.vue.rows);
      });
  };

  app.reset_form = function () {
    app.vue.add_content = "";
  };

  app.set_add_post = function (new_post) {
    app.vue.add_mode = new_post;
  };

  app.delete_post = function (row_idx) {
    let id = app.vue.rows[row_idx].id;
    axios
      .get(delete_post_url, { params: { id: id } })
      .then(function (response) {
        for (let i = 0; i < app.vue.rows.length; i++) {
          if (app.vue.rows[i].id === id) {
            app.vue.rows.splice(i, 1);
            app.enumerate(app.vue.rows);
            break;
          }
        }
      });
  };

  app.upvote_post = function (row_idx) {
    let id = app.vue.rows[row_idx].id;

    axios.post(upvote_post_url, { id: id }).then(function (response) {
      for (let i = 0; i < app.vue.rows.length; i++) {
        if (app.vue.rows[i].id === id) {
          if (response.data === "in") {
            app.vue.rows[i].thumbs_up.push(app.vue.email);
          } else if (response.data === "in_and_flip") {
            removeItem(app.vue.rows[i].thumbs_down, app.vue.email);
            app.vue.rows[i].thumbs_up.push(app.vue.email);
          } else {
            removeItem(app.vue.rows[i].thumbs_up, app.vue.email);
          }
        }
      }
    });
  };

  app.downvote_post = function (row_idx) {
    let id = app.vue.rows[row_idx].id;

    axios.post(downvote_post_url, { id: id }).then(function (response) {
      for (let i = 0; i < app.vue.rows.length; i++) {
        if (app.vue.rows[i].id === id) {
          if (response.data === "in") {
            app.vue.rows[i].thumbs_down.push(app.vue.email);
          } else if (response.data === "in_and_flip") {
            removeItem(app.vue.rows[i].thumbs_up, app.vue.email);
            app.vue.rows[i].thumbs_down.push(app.vue.email);
          } else {
            removeItem(app.vue.rows[i].thumbs_down, app.vue.email);
          }
        }
      }
    });
  };

  // app.show_upvotes = function (row_idx) {
  //   let new_status = "";

  //   let vote_list = app.vue.rows[row_idx].thumbs_up.toString();
  //   axios
  //     .get(get_vote_names_url, { params: { vote_list: vote_list } })
  //     .then(function (response) {
  //       let names = response.data["name_string"].split(",");
  //       if (names.length > 1 || names[0] !== "") {
  //         new_status += "Liked by ";
  //       }
  //       for (let i = 0; i < names.length - 1; i++) {
  //         new_status += names[i] + ", ";
  //       }
  //       new_status += names[names.length - 1];

  //       app.vue.vote_status = new_status;
  //       app.vue.hover_idx = row_idx;
  //     });
  // };

  // app.show_downvotes = function (row_idx) {
  //   let new_status = "";

  //   let vote_list = app.vue.rows[row_idx].thumbs_down.toString();
  //   axios
  //     .get(get_vote_names_url, { params: { vote_list: vote_list } })
  //     .then(function (response) {
  //       let names = response.data["name_string"].split(",");

  //       if (names.length > 1 || names[0] !== "") {
  //         new_status += "Disliked by ";
  //       }
  //       for (let i = 0; i < names.length - 1; i++) {
  //         new_status += names[i] + ", ";
  //       }
  //       new_status += names[names.length - 1];

  //       app.vue.vote_status = new_status;
  //       app.vue.hover_idx = row_idx;
  //     });
  // };

  // app.hide_votes = function () {
  //   app.vue.hover_idx = -1;
  // };

  app.view_profile = function (username) {
    window.location.href = `../view_profile/${username}`;
  };

  app.view_comments = function (comments_id) {
    window.location.href = `../view_comment/${comments_id}`;
  };

  // This contains all the methods.
  app.methods = {
    // Complete as you see fit.
    add_post: app.add_post,
    reset_form: app.reset_form,
    set_add_post: app.set_add_post,
    delete_post: app.delete_post,
    upvote_post: app.upvote_post,
    downvote_post: app.downvote_post,
    // show_upvotes: app.show_upvotes,
    // show_downvotes: app.show_downvotes,
    // hide_votes: app.hide_votes,
    view_profile: app.view_profile,
    view_comments: app.view_comments,
  };

  // This creates the Vue instance.
  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    watch: app.watch,
    methods: app.methods,
  });

  // And this initializes it.
  app.init = () => {
    // Put here any initialization code.
    // Typically this is a server GET call to load the data.
    axios.get(load_posts_url).then(function (response) {
      app.vue.rows = app.enumerate(response.data.rows);
      app.vue.rows.forEach(function (row) {
        let d = new Date(row.datetime);
        row.display_datetime = `${ago(d.getTime())} ago`;
      });
      app.vue.email = response.data.email;
      app.vue.sort_option = "Most Recent";
      console.log(app.vue.rows);
    });
  };

  // Call to the initializer.
  app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);
