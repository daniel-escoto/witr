Who is in the Right Documentation

Purpose:

Our group wanted to create a website like reddit, that would allow users to share controversial life experiences and let others decide whether you were in the right or wrong! This website would also feature a leaderboard for users to see who averages better/worse than others in the community.

Databases:



*   Profile (An extension of Auth DB)
    *   Fields
        *   User - Reference to Auth User, contains user id from Auth DB, int/id
        *   Username - contains username, for ease of verification, string
        *   File_name - contains uploaded filename, string
        *   File_type - contains uploaded file type, string
        *   File_date - contains uploaded file timestamp, string
        *   File_path - contains file path to bucket, string
        *   File_size - contains the file size, integer
        *   Confirmed - confirm whether the file is uploaded, boolean
*   Post
    *   Fields
        *   Content - contains the content of the created post, string
        *   first_name - contains the the author’s first name, string
        *   Last_name - contains the author’s last name, string
        *   Username - contains username, string
        *   Author email - contains the authors email, string
        *   Thumbs_up - contains a list of users who upvoted, list of strings 
        *   Thumbs_down - contains a list of users who downvoted, list of strings 
        *   Datetime - a timestamp of when the post was created, time format
*   Comment
    *   Fields
        *   Parent_Post - reference to the post db, int/id
        *   Content - contains the content of the comment
        *   Username - contains username, string
        *   Author email - contains the authors email, string
        *   Thumbs_up - contains a list of users who upvoted, list of strings 
        *   Thumbs_down - contains a list of users who downvoted, list of strings 
        *   Datetime - a timestamp of when the post was created, time format

Index Page/ Home Page/ Who’s in the Right:

Description:

The Home page is where the user lands, after being prompted to register an account. In order to use the website the user needs to create an account. Our implementation was to reuse the authentication database, so that user information is stored there and we can reuse it in our website. The user will be prompted with the option to create a post, look at the leaderboard, or look at existing posts and be able to search/filter them. Profiles are viewable after clicking on the username of a post/comment or in the leaderboard page, the username/avatar. This gives an incentive for the user to share a story first. Each post will have a display of content, option to vote in the right/wrong with display, timestamp, option to remove (if author), comment button to go to comments.  

Implementation:

index.html / index.js

We design the posts to be created in tiles in order to create a vertical column. The posts are dynamic, as they are defined in (index.js) to listen when adding, deleting, sorting, and voting on posts.

Adding:													Creates a post, pushes to the db and updates the current page with the addition, if the post was cancelled then it resets the form/textarea and cancels any operation. Within this operation there is a check to see what sort option the posts are in and updates respectively.

Deleting:

Deletes a post, pushes the delete to the db and updates the current page with the deletion(only authors are allowed)

In the right/wrong (upvote/downvote):

Actively waiting for a click by the user, and the user gets logged into the posts databases under the list of the respective vote. If the same button is clicked then it deletes the vote. 

Search Posts:

Actively waiting for an input to filter posts according to a match in text. Filtered posts will update on the page. Deleting any input will return it to the original format.

Sort Posts:

Also Actively waiting for another option to be given. Posts are shown in the most recent order but are able to be filtered by most upvotes, most downvotes, most votes, and most controversial. In (index.js) and any other page that has a sort option, we use a vue instance of watch to update the posts when the sorted filter is changed.

Each post also has a comment section that is clickable on each post which redirects to the comments page. The leaderboard button redirects the user to the leaderboard. There is a sort menu available to filter posts according to the given option. Profiles are viewable after clicking on the username of a post/comment or in the leaderboard page, the username/avatar. 

Comments:

Description:

The comments page is where the thread is fully shown with an upscaled counter for votes and the ability to leave feedback on a post.  Comments follow a similar layout to posts.

Implementation:

view_comments.html, view_comments.js

This page is divided into three container blocks to separate the contents of the page. The top portion is where the post is displayed. The post layout is slightly different from the ones shown in the main page. The votes are taken from the tile belonging to the post and are added to the middle of the page as buttons that are good size to allow the user an ease of access to vote. There is a text area at the bottom the vote buttons to prompt the user to leave feedback. Comments follow the same implementation as posts, when they are added/submitted they are updated on the page accordingly and pushed into the comments database. And on deletion, deletes the instance and updates. Comments also feature a sort option similar to posts that follow votes or time of date.

Profile:

Description:

This page is for displaying the given user’s average rating, reputation, picture, and posts. The user can upload a picture from their own profile page to give some personality to their profile. The user’s post history is also available for anyone browsing around catching up on posts.

Implementation:

view_profile.html, 

In the HTML portion, we wanted to split the two main sections into columns where the posts column was a quarter bigger than the profile card column. There is also a title and a go back button for the viewing user to go back to the homepage. 

The profile card (left side), displays the users info and their average/reputation. Also displays their current uploaded profile picture. If the user hasn't uploaded a picture then a default avatar is provided. If the user is viewing their own page then they should see a button to upload a photo. This operation is all done in (view_profile.js), the user is prompted a preview of their documents and chooses their own photo. This photo name and type is sent to the cloud bucket (we created called /witr-uploads), the bucket server responds back with an upload link/signed url for the photo to be uploaded on. When the file is uploaded, the server responds with file path/type/size and a confirmation that it was uploaded successfully. This gets added into our profile database, so we can pull the url link for the photo with ease.  When there is a photo uploaded already to the profile, then the user has the option delete it (with a delete button, now visible), this will restore the generic avatar. If the user was planning to change their photo then they can just hit the upload button again to change it. The backend implementation for this is to delete any information, if available, before uploading. Also when the user chooses to delete, the server is notified to delete the given path that was stored in profiles db. The photo is modified to have a border radius of 50% to make it a circle and make it look like an appropriate avatar. 

Posts follows the same implementation as the homepage, instead with a filter of just the given user’s posts.

Leaderboard:

Description:

This page is for displaying the most upvoted/downvoted user on the website. 

Implementation:

view_leaderboard.html, view_leaderboard.js 

The leaderboard is featured as a table that is updated dynamically when a new user is registered onto the site. This table displays the user name of the user, their avatar, avg rating and their reputation:

(0-49%) = In the Wrong

50% = Neutral

51+ %= In the right

If no post was made then they are set at 0, with a reputation of N/A

Username and avatar are clickable to redirect the user to the specified profile page. There is a sort option that filters the table from highest average to lowest, vice versa.  
