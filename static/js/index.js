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

// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {
  // This is the Vue data.
  app.data = {
    // Complete as you see fit.
    add_mode: false,
    add_content: "",
    rows: [],
    email: "",
    hover_idx: -1,
    vote_status: "",
    query_posts: '',
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

  // Search Function
  app.find_posts = function () {
     axios
       .get(find_posts_url, {params: {q: app.vue.query_posts}})
       .then(function (r) {
           app.vue.rows = app.enumerate(r.data.posts);
       });
  };

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
        });
        app.enumerate(app.vue.rows);
        app.reset_form();
        app.set_add_post(false);
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

  app.show_upvotes = function (row_idx) {
    let new_status = "";

    let vote_list = app.vue.rows[row_idx].thumbs_up.toString();
    axios
      .get(get_vote_names_url, { params: { vote_list: vote_list } })
      .then(function (response) {
        let names = response.data["name_string"].split(",");
        if (names.length > 1 || names[0] !== "") {
          new_status += "Liked by ";
        }
        for (let i = 0; i < names.length - 1; i++) {
          new_status += names[i] + ", ";
        }
        new_status += names[names.length - 1];

        app.vue.vote_status = new_status;
        app.vue.hover_idx = row_idx;
      });
  };

  app.show_downvotes = function (row_idx) {
    let new_status = "";

    let vote_list = app.vue.rows[row_idx].thumbs_down.toString();
    axios
      .get(get_vote_names_url, { params: { vote_list: vote_list } })
      .then(function (response) {
        let names = response.data["name_string"].split(",");

        if (names.length > 1 || names[0] !== "") {
          new_status += "Disliked by ";
        }
        for (let i = 0; i < names.length - 1; i++) {
          new_status += names[i] + ", ";
        }
        new_status += names[names.length - 1];

        app.vue.vote_status = new_status;
        app.vue.hover_idx = row_idx;
      });
  };

  app.hide_votes = function () {
    app.vue.hover_idx = -1;
  };

  app.view_profile = function (username) {
    window.location.href = `../view/${username}`;
  };

  // This contains all the methods.
  app.methods = {
    // Complete as you see fit.
    find_posts: app.find_posts,
    add_post: app.add_post,
    reset_form: app.reset_form,
    set_add_post: app.set_add_post,
    delete_post: app.delete_post,
    upvote_post: app.upvote_post,
    downvote_post: app.downvote_post,
    show_upvotes: app.show_upvotes,
    show_downvotes: app.show_downvotes,
    hide_votes: app.hide_votes,
    view_profile: app.view_profile,
  };

  // This creates the Vue instance.
  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    methods: app.methods,
  });

  // And this initializes it.
  app.init = () => {
    // Put here any initialization code.
    // Typically this is a server GET call to load the data.
    axios.get(load_posts_url).then(function (response) {
      app.vue.rows = app.enumerate(response.data.rows);
      app.vue.email = response.data.email;
    });
  };

  // Call to the initializer.
  app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);
