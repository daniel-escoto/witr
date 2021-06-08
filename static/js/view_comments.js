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

let init = (app) => {
  app.data = {
    post: {},
    sort_option: "",
    add_content: "",
    rows: [],
    email: "",
  };
  app.watch = {
    sort_option: function () {
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

  app.index = function () {
    window.location.href = `../`;
  };

  app.delete_post = function () {
    let id = app.vue.post.id;
    axios
      .get(delete_post_url, { params: { id: id } })
      .then(function (response) {
        // TODO what about when the post has comments
        axios
          .get(delete_all_comments_url, {
            params: { parent_post: id },
          })
          .then(function (response) {
            window.location.href = `../index`;
          });
      });
  };

  app.upvote_post = function () {
    let id = app.vue.post.id;

    axios.post(upvote_post_url, { id: id }).then(function (response) {
      if (response.data === "in") {
        app.vue.post.thumbs_up.push(app.vue.email);
      } else if (response.data === "in_and_flip") {
        removeItem(app.vue.post.thumbs_down, app.vue.email);
        app.vue.post.thumbs_up.push(app.vue.email);
      } else {
        removeItem(app.vue.post.thumbs_up, app.vue.email);
      }
    });
  };

  app.downvote_post = function () {
    let id = app.vue.post.id;

    axios.post(downvote_post_url, { id: id }).then(function (response) {
      if (response.data === "in") {
        app.vue.post.thumbs_down.push(app.vue.email);
      } else if (response.data === "in_and_flip") {
        removeItem(app.vue.post.thumbs_up, app.vue.email);
        app.vue.post.thumbs_down.push(app.vue.email);
      } else {
        removeItem(app.vue.post.thumbs_down, app.vue.email);
      }
    });
  };

  app.add_comment = function () {
    axios
      .post(add_comment_url, {
        post_id: app.vue.post.id,
        content: app.vue.add_content,
      })
      .then(function (response) {
        app.vue.rows.push({
          id: response.data.id,
          parent_id: app.vue.post.id,
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

        app.vue.add_content = "";
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

  app.delete_comment = function (row_idx) {
    let id = app.vue.rows[row_idx].id;
    axios
      .get(delete_comment_url, { params: { id: id } })
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

  app.upvote_comment = function (row_idx) {
    let id = app.vue.rows[row_idx].id;

    axios.post(upvote_comment_url, { id: id }).then(function (response) {
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

  app.downvote_comment = function (row_idx) {
    let id = app.vue.rows[row_idx].id;

    axios.post(downvote_comment_url, { id: id }).then(function (response) {
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

  app.methods = {
    view_profile: app.view_profile,
    delete_post: app.delete_post,
    upvote_post: app.upvote_post,
    downvote_post: app.downvote_post,

    add_comment: app.add_comment,
    delete_comment: app.delete_comment,
    upvote_comment: app.upvote_comment,
    downvote_comment: app.downvote_comment,
    index: app.index,
  };

  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    watch: app.watch,
    methods: app.methods,
  });

  app.init = () => {
    axios.get(load_post_url).then(function (response) {
      app.vue.rows = app.enumerate(response.data.rows);
      app.vue.rows.forEach(function (row) {
        let d = new Date(row.datetime);
        row.display_datetime = `${ago(d.getTime())} ago`;
      });
      app.vue.post = response.data.post;
      app.vue.post.display_datetime = displayTimeDate(app.vue.post.datetime);
      app.vue.email = response.data.email;
      app.vue.sort_option = "Most Recent";
    });
  };

  app.init();
};

init(app);
