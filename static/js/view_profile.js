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
    picture: "",
    file_name: null, // File name
    file_type: null, // File type
    file_date: null, // Date when file uploaded
    file_path: null, // Path of file in GCS
    file_size: null, // Size of uploaded file
    uploading: false, // upload in progress
    deleting: false, // delete in progress
    delete_confirmation: false, // Show the delete confirmation thing.
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
/*
  app.upload_file = function (event){
      let input =event.target;
      let file = input.files[0];
      let row = app.vue.profile[0]
      console.log(row)
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
*/
    app.upload_file = function (event) {
        let input = event.target;
        let file = input.files[0];
        if (file) {
            app.vue.uploading = true;
            let file_type = file.type;
            let file_name = file.name;
            let file_size = file.size;
            // Requests the upload URL.
            axios.post(obtain_gcs_url, {
                action: "PUT",
                mimetype: file_type,
                file_name: file_name
            }).then ((r) => {
                let upload_url = r.data.signed_url;
                let file_path = r.data.file_path;
                // Uploads the file, using the low-level interface.
                let req = new XMLHttpRequest();
                // We listen to the load event = the file is uploaded, and we call upload_complete.
                // That function will notify the server `of the location of the image.
                req.addEventListener("load", function () {
                    app.upload_complete(file_name, file_type, file_size, file_path);
                });
                // TODO: if you like, add a listener for "error" to detect failure.
                req.open("PUT", upload_url, true);
                req.send(file);
            });
        }
    }

    app.upload_complete = function (file_name, file_type, file_size, file_path) {
        // We need to let the server know that the upload was complete;
        axios.post(notify_url, {
            file_name: file_name,
            file_type: file_type,
            file_path: file_path,
            file_size: file_size,
        }).then( function (r) {
            app.vue.uploading = false;
            app.vue.file_name = file_name;
            app.vue.file_type = file_type;
            app.vue.file_path = file_path;
            app.vue.file_size = file_size;
            app.vue.file_date = r.data.file_date;
        });
    }

    app.delete_file = function () {
        if (!app.vue.delete_confirmation) {
            // Ask for confirmation before deleting it.
            app.vue.delete_confirmation = true;
        } else {
            // It's confirmed.
            app.vue.delete_confirmation = false;
            app.vue.deleting = true;
            // Obtains the delete URL.
            let file_path = app.vue.file_path;
            axios.post(obtain_gcs_url, {
                action: "DELETE",
                file_path: file_path,
            }).then(function (r) {
                let delete_url = r.data.signed_url;
                if (delete_url) {
                    // Performs the deletion request.
                    let req = new XMLHttpRequest();
                    req.addEventListener("load", function () {
                        app.deletion_complete(file_path);
                    });
                    // TODO: if you like, add a listener for "error" to detect failure.
                    req.open("DELETE", delete_url);
                    req.send();

                }
            });
        }
    };

    app.deletion_complete = function (file_path) {
        // We need to notify the server that the file has been deleted on GCS.
        axios.post(delete_url, {
            file_path: file_path,
        }).then (function (r) {
            // Poof, no more file.
            app.vue.deleting =  false;
            app.vue.file_name = null;
            app.vue.file_type = null;
            app.vue.file_date = null;
            app.vue.file_path = null;
        })
    }

    app.set_result = function (r) {
        // Sets the results after a server call.
        app.vue.file_name = r.data.file_name;
        app.vue.file_type = r.data.file_type;
        app.vue.file_date = r.data.file_date;
        app.vue.file_path = r.data.file_path;
        app.vue.file_size = r.data.file_size;
    }
  
  
 
  app.methods = {
    delete_post: app.delete_post,
    upvote_post: app.upvote_post,
    downvote_post: app.downvote_post,
    show_upvotes: app.show_upvotes,
    show_downvotes: app.show_downvotes,
    hide_votes: app.hide_votes,
    upload_file: app.upload_file,
    delete_file: app.delete_file, // Delete the file.
    
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
    });
    axios.get(load_profposts_url).then(function (response) {
      app.vue.rows = app.enumerate(response.data.rows);
      app.vue.email = response.data.email;
    });
    axios.get(file_info_url)
        .then(function (r) {
            app.set_result(r);
    });
    
  };
  app.init();
};

init(app);
