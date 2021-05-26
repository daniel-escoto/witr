let app = {};

function removeItem(array, item) {
  for (var i in array) {
    if (array[i] == item) {
      array.splice(i, 1);
      break;
    }
  }
}
let init = (app) => {
  app.data = {
    username: "",
    full_name: "",
    rows: [],
    email: "",
    hover_idx: -1,
    vote_status: "",
    permission: false,
    profile: []
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

  app.upload_file = function (event){
      let input =event.target;
      let file = input.files[0];
      let row = app.vue.profile[0]
      if (file){
          let reader = new FileReader();
          reader.addEventListener("load", function(){
              //Send image to server
              axios.post(upload_picture_url, 
              {
                  profid: row.id,
                  picture: reader.result,
              }
              ).then(function(){
                row.picture = reader.result;
              }
                  );
          });
          reader.readAsDataURL(file);
      }
  }
  app.methods = {
    delete_post: app.delete_post,
    upvote_post: app.upvote_post,
    downvote_post: app.downvote_post,
    show_upvotes: app.show_upvotes,
    show_downvotes: app.show_downvotes,
    hide_votes: app.hide_votes,
    upload_file: app.upload_file,
    
  };

  app.vue = new Vue({
    el: "#vue-target",
    data: app.data,
    methods: app.methods,
  });

  app.init = () => {
    axios.get(load_user_info_url).then(function (response) {
      app.vue.username = response.data.username;
      app.vue.full_name = response.data.full_name;
      app.vue.permission = response.data.permission;
      app.vue.picture = response.data.picture;
      app.vue.profile = response.data.profile;
    });
    axios.get(load_profposts_url).then(function (response) {
      app.vue.rows = app.enumerate(response.data.rows);
      app.vue.email = response.data.email;
    });
  };
  app.init();
};

init(app);
