"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""
import datetime
import json
import os
import traceback
import uuid
import math
from nqgcs import NQGCS

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from .settings import APP_FOLDER
from .gcs_url import gcs_url

url_signer = URLSigner(session)

BUCKET = '/witr-uploads'
# GCS keys.  You have to create them for this to work.  See README.md
GCS_KEY_PATH = os.path.join(APP_FOLDER, 'private/witr_keys.json')
with open(GCS_KEY_PATH) as gcs_key_f:
    GCS_KEYS = json.load(gcs_key_f)

# I create a handle to gcs, to perform the various operations.
gcs = NQGCS(json_key_path=GCS_KEY_PATH)




@action('index')
@action.uses(db, auth, url_signer, 'index.html')
def index():
    user = auth.get_user() or redirect(URL('auth/login'))
    return dict(
        # COMPLETE: return here any signed URLs you need.
        # my_callback_url = URL('my_callback', signer=url_signer),
        load_posts_url = URL('load_posts', signer=url_signer),
        add_post_url = URL('add_post', signer=url_signer),
        delete_post_url = URL('delete_post', signer=url_signer),
        upvote_post_url = URL('upvote_post', signer=url_signer),
        downvote_post_url = URL('downvote_post', signer=url_signer),
        get_vote_names_url = URL('get_vote_names', signer=url_signer),
    )


@action('view_leaderboard', method="GET")
@action.uses(db, auth, url_signer, 'view_leaderboard.html')
def view_leaderboard():
    user = auth.get_user() or redirect(URL('auth/login'))
        
    return dict(
        load_view_leaderboard = URL('load_view_leaderboard', signer=url_signer)
    )


@action('load_view_leaderboard', method="GET")
@action.uses(db, url_signer.verify())
def load_view_leaderboard():
    user = auth.get_user() or redirect(URL('auth/login'))
    newRows = [] #result [{username, avg, rep, profile pic}, ...]
    checked = [] #history
    thumbsup = 0
    thumbslength = 0
    rows = db(db.post).select().as_list()
    for r in rows: #parse posts
        dic = {}
        if r['username'] not in checked: #check if we havent validated already
            thumbsup=0
            thumbslength=0
            dic['username'] = r['username']
            checked.append(r['username'])
            rows2 = db(db.post.username == r['username']).select().as_list()
            picture = db(db.profile.username == r['username']).select().first()
            for ar in rows2: #record
                thumbsup+=len(ar['thumbs_up'])
                thumbslength+=(len(ar['thumbs_up'])+len(ar['thumbs_down']))
                
            #print("Thumbs up: ", thumbsup)
            #print("Thumbs len: ", thumbslength)
            if thumbslength == 0:
                dic['avg'] = 0
                dic['reputation'] = "N/A"
            else:
                dic['avg'] = math.floor((thumbsup/thumbslength) * 100)
                if dic['avg'] > 50: #assign rep
                    dic['reputation'] = "In the Right" 
                elif dic['avg'] < 50:
                    dic['reputation'] = "In the Wrong"
                else: #equal
                    dic['reputation'] = "Neutral"
            dic['picture'] = "https://storage.googleapis.com" + picture.file_path if picture is not None else "" #picture
            newRows.append(dic)
            
            
    sorted(newRows, key = lambda i: i['avg']) # This will sort high avg to low
    return dict(
        lrows = newRows,
    )  
    
@action('load_posts')
@action.uses(url_signer.verify(), db)
def load_posts():
    user = auth.get_user() or redirect(URL('auth/login'))

    rows=db(db.post).select().as_list()
    comment_counts = {}

    for row in rows:
        id = row.get("id")
        comment_count = (len(db(db.comment.parent_post == id).select().as_list()))
        comment_counts[id] = comment_count


    return dict(rows=rows,
                email=user.get("email"),
                comment_counts=comment_counts,)
                
                
@action('load_profposts/<username>')
@action.uses(url_signer.verify(), db)
def load_profposts(username):
    user = auth.get_user() or redirect(URL('auth/login'))
    rows = db(db.post.username == username).select().as_list()
    return dict(rows=rows,
                email=user.get("email"),)

@action('add_post', method="POST")
@action.uses(url_signer.verify(), db)
def add_post():
    user = auth.get_user() or redirect(URL('auth/login'))

    first_name = user.get('first_name')
    last_name = user.get('last_name')
    email = user.get('email')
    username = user.get('username')
    thumbs_up = []
    thumbs_down = []
    now = datetime.datetime.now()
    id = db.post.insert(
        content=request.json.get('content'),
        first_name=first_name,
        last_name=last_name,
        author_email=email,
        username=username,
        thumbs_up=thumbs_up,
        thumbs_down=thumbs_down,
        datetime=now,
    )

    return dict(id=id,
                first_name=first_name,
                last_name=last_name,
                email=email,
                username=username,
                thumbs_up=thumbs_up,
                thumbs_down=thumbs_down,
                datetime=now,)

@action('delete_post')
@action.uses(url_signer.verify(), db)
def delete_post():
    id = request.params.get('id')
    assert id is not None
    db(db.post.id == id).delete()
    return "ok"

@action('upvote_post', method="POST")
@action.uses(url_signer.verify(), db)
def upvote_post():
    user = auth.get_user() or redirect(URL('auth/login'))
    email = user.get('email')
    id = request.json.get('id')
    assert id is not None
    upvote_list = (db(db.post.id == id)).select().first().thumbs_up
    downvote_list = (db(db.post.id == id)).select().first().thumbs_down

    if email in upvote_list:
        upvote_list.remove(email)
        status = "out"
    else:
        upvote_list.append(email)
        status = "in"
        if email in downvote_list:
            downvote_list.remove(email)
            status = "in_and_flip"

    db(db.post.id == id).update(
        thumbs_up=upvote_list,
        thumbs_down=downvote_list,
    )

    return status

@action('downvote_post', method="POST")
@action.uses(url_signer.verify(), db)
def downvote_post():
    user = auth.get_user() or redirect(URL('auth/login'))
    email = user.get('email')
    id = request.json.get('id')
    assert id is not None
    upvote_list = (db(db.post.id == id)).select().first().thumbs_up
    downvote_list = (db(db.post.id == id)).select().first().thumbs_down

    if email in downvote_list:
        downvote_list.remove(email)
        status = "out"
    else:
        downvote_list.append(email)
        status = "in"
        if email in upvote_list:
            upvote_list.remove(email)
            status = "in_and_flip"

    db(db.post.id == id).update(
        thumbs_up=upvote_list,
        thumbs_down=downvote_list,
    )

    return status

@action('get_vote_names')
@action.uses(url_signer.verify(), db)
def get_vote_names():
    name_string = ""

    vote_email_list = request.params.get('vote_list').split(',')
    for email in vote_email_list:
        selected = (db(db.auth_user.email == email)).select().first()
        if selected is not None:
            # first_name = selected.get("first_name")
            # last_name = selected.get("last_name")

            # name_string += first_name + " " + last_name + ","

            username = selected.get("username")
            name_string += username + ","

    name_string = name_string[:-1] if len(name_string) > 0 else ""

    return dict(name_string=name_string)





@action('view_profile/<username>', method=["GET"])
@action.uses(url_signer, auth, db, 'view_profile.html')
def view_profile(username):
    user = auth.get_user() or redirect(URL('auth/login'))
    return dict(
        load_user_info_url = URL('load_user_info', username, signer=url_signer),
        load_profposts_url = URL('load_profposts', username, signer=url_signer),
        delete_post_url = URL('delete_post', signer=url_signer),
        upvote_post_url = URL('upvote_post', signer=url_signer),
        downvote_post_url = URL('downvote_post', signer=url_signer),
        get_vote_names_url = URL('get_vote_names', signer=url_signer),
        upload_picture_url = URL('upload_picture', signer=url_signer),
        file_info_url = URL('file_info', signer=url_signer),
        obtain_gcs_url = URL('obtain_gcs', signer=url_signer),
        notify_url = URL('notify_upload', signer=url_signer),
        delete_url = URL('notify_delete', signer=url_signer),
    )

@action('load_user_info/<username>', method=["GET"])
@action.uses(url_signer.verify(), db)
def load_user_info(username):
    user = auth.get_user() 
    #Check for Permissions to allow editing on page
    permission = False
    if user.get('username') == username:
        permission = True
    
    thumbsup = 0
    thumbslength = 0
    rows = db(db.post.username == username).select().as_list()
    for r in rows: #parse posts
        thumbsup+=len(r['thumbs_up'])
        thumbslength+=(len(r['thumbs_up'])+len(r['thumbs_down']))
    if thumbslength == 0:
        rating = str(0)
        rep = "N/A"
    else:
        rating = math.floor((thumbsup/thumbslength) * 100)
        if rating > 50: #assign rep
            rating =str(rating)
            rep ="In the Right"
        elif rating < 50:
            rating = str(rating)
            rep = "In the Wrong"
        else: #equal
            rating =str(rating)
            rep = "Neutral"
    user1 = (db(db.post.username == username)).select().first()
    found_username = user1.username
    found_full_name = user1.first_name + " " + user1.last_name
    prof = db(db.profile.username == username).select().first()
    if not prof:
        prof = ""
    else:
        prof = "https://storage.googleapis.com" + prof.file_path
        
    return dict(
        username = found_username,
        full_name = found_full_name,
        permission = permission,
        picture= prof,
        rating = rating,
        rep = rep,
    )
    
@action('view_comments/<post_id>', method=["GET"])
@action.uses(url_signer, auth, db, 'view_comments.html')
def view_comments(post_id):
    user = auth.get_user() or redirect(URL('auth/login'))
    return dict(
        # post urls
        load_post_url = URL('load_post', post_id, signer=url_signer),
        delete_post_url = URL('delete_post', signer=url_signer),
        upvote_post_url = URL('upvote_post', signer=url_signer),
        downvote_post_url = URL('downvote_post', signer=url_signer),
        get_vote_names_url = URL('get_vote_names', signer=url_signer),

        # comments urls
        load_comments_url = URL('load_comments', post_id, signer=url_signer),
        add_comment_url = URL('add_comment', signer=url_signer),
        delete_comment_url = URL('delete_comment', signer=url_signer),
        delete_all_comments_url = URL('delete_all_comments', signer=url_signer),
        upvote_comment_url = URL('upvote_comment', signer=url_signer),
        downvote_comment_url = URL('downvote_comment', signer=url_signer),
    )

# TODO
@action('load_post/<post_id>', method=["GET"])
@action.uses(url_signer.verify(), db)
def load_post(post_id):
    user = auth.get_user() or redirect(URL('auth/login'))
    return dict(post=db(db.post.id == post_id).select().as_list()[0],
                email=user.get("email"),
                rows=db(db.comment.parent_post == post_id).select().as_list(),)

# TODO
@action('load_comments/<post_id>', method=["GET"])
@action.uses(url_signer.verify(), db)
def load_comments(post_id):
    pass

# TODO
@action('add_comment', method=["POST"])
@action.uses(url_signer.verify(), db)
def add_comment():
    user = auth.get_user() or redirect(URL('auth/login'))

    email = user.get('email')
    username = user.get('username')
    thumbs_up = []
    thumbs_down = []
    now = datetime.datetime.now()
    id = db.comment.insert(
        parent_post=request.json.get('post_id'),
        content=request.json.get('content'),
        author_email=email,
        username=username,
        thumbs_up=thumbs_up,
        thumbs_down=thumbs_down,
        datetime=now,
    )

    return dict(id=id,
                email=email,
                username=username,
                thumbs_up=thumbs_up,
                thumbs_down=thumbs_down,
                datetime=now,)


@action('delete_comment')
@action.uses(url_signer.verify(), db)
def delete_comment():
    id = request.params.get('id')
    assert id is not None
    db(db.comment.id == id).delete()
    return "ok"

@action('delete_all_comments')
@action.uses(url_signer.verify(), db)
def delete_all_comments():
    # id = request.params.get('id')
    # assert id is not None
    # db(db.comment.id == id).delete()

    parent_post = request.params.get('parent_post')
    assert parent_post is not None
    db(db.comment.parent_post == parent_post).delete()
    return "ok"

# TODO
@action('upvote_comment', method="POST")
@action.uses(url_signer.verify(), db)
def upvote_comment():
    user = auth.get_user() or redirect(URL('auth/login'))
    email = user.get('email')
    id = request.json.get('id')
    assert id is not None
    upvote_list = (db(db.comment.id == id)).select().first().thumbs_up
    downvote_list = (db(db.comment.id == id)).select().first().thumbs_down

    if email in upvote_list:
        upvote_list.remove(email)
        status = "out"
    else:
        upvote_list.append(email)
        status = "in"
        if email in downvote_list:
            downvote_list.remove(email)
            status = "in_and_flip"

    db(db.comment.id == id).update(
        thumbs_up=upvote_list,
        thumbs_down=downvote_list,
    )

    return status

# TODO
@action('downvote_comment', method="POST")
@action.uses(url_signer.verify(), db)
def downvote_comment():
    user = auth.get_user() or redirect(URL('auth/login'))
    email = user.get('email')
    id = request.json.get('id')
    assert id is not None
    upvote_list = (db(db.comment.id == id)).select().first().thumbs_up
    downvote_list = (db(db.comment.id == id)).select().first().thumbs_down

    if email in downvote_list:
        downvote_list.remove(email)
        status = "out"
    else:
        downvote_list.append(email)
        status = "in"
        if email in upvote_list:
            upvote_list.remove(email)
            status = "in_and_flip"

    db(db.comment.id == id).update(
        thumbs_up=upvote_list,
        thumbs_down=downvote_list,
    )

    return status

#
# GCS CODE
#
#
@action('file_info')
@action.uses(url_signer.verify(), db)
def file_info():
    """Returns to the web app the information about the file currently
    uploaded, if any, so that the user can download it or replace it with
    another file if desired."""
    user = auth.get_user()
    row = db(db.profile.user == user.get('id')).select().first()
    # The file is present if the row is not None, and if the upload was
    # confirmed.  Otherwise, the file has not been confirmed as uploaded,
    # and should be deleted.
    if row is not None and not row.confirmed:
        # We need to try to delete the old file content.
        delete_path(row.file_path)
        row.delete_record()
        row = {}
    if row is None:
        # There is no file.
        row = {}
    file_path = row.get('file_path')
    return dict(
        file_name=row.get('file_name'),
        file_type=row.get('file_type'),
        file_date=row.get('file_date'),
        file_size=row.get('file_size'),
        file_path=file_path,
        # These two could be controlled to get other things done.
        upload_enabled=True,
    )

@action('obtain_gcs', method="POST")
@action.uses(url_signer.verify(), db)
def obtain_gcs():
    """Returns the URL to do download / upload / delete for GCS."""
    user = auth.get_user()
    verb = request.json.get("action")
    if verb == "PUT":
        mimetype = request.json.get("mimetype", "")
        file_name = request.json.get("file_name")
        extension = os.path.splitext(file_name)[1]
        # Use + and not join for Windows, thanks Blayke Larue
        file_path = BUCKET + "/" + str(uuid.uuid1()) + extension
        # Marks that the path may be used to upload a file.
        mark_possible_upload(file_path)
        upload_url = gcs_url(GCS_KEYS, file_path, verb='PUT',
                             content_type=mimetype)
        return dict(
            signed_url=upload_url,
            file_path=file_path
        )
    elif verb == "DELETE":
        file_path = request.json.get("file_path")
        if file_path is not None:
            # We check that the file_path belongs to the user.
            r = db(db.profile.file_path == file_path).select().first()
            if r is not None and r.user == user.get('id'):
                # Yes, we can let the deletion happen.
                delete_url = gcs_url(GCS_KEYS, file_path, verb='DELETE')
                return dict(signed_url=delete_url)
        # Otherwise, we return no URL, so we don't authorize the deletion.
        return dict(signer_url=None)

@action('notify_upload', method="POST")
@action.uses(url_signer.verify(), db)
def notify_upload():
    """We get the notification that the file has been uploaded."""
    user1 = auth.get_user()
    file_type = request.json.get("file_type")
    file_name = request.json.get("file_name")
    file_path = request.json.get("file_path")
    file_size = request.json.get("file_size")
    # Deletes any previous file.
    rows = db(db.profile.user == user1.get('id')).select()
    for r in rows:
        if r.file_path != file_path:
            delete_path(r.file_path)
            
            
    rows = db(db.profile.user == user1.get('id')).select().first()
    # Marks the upload as confirmed.
    d = datetime.datetime.utcnow()
    db.profile.update_or_insert(
        ((db.profile.user == user1.get('id')) &
         (db.profile.file_path == file_path)),
        username = user1.get('username'),
        file_path=file_path,
        file_name=file_name,
        file_type=file_type,
        file_date=d,
        file_size=file_size,
        confirmed=True,
    )
    # Returns the file information.
    return dict(
        download_url=gcs_url(GCS_KEYS, file_path, verb='GET'),
        file_date=d,
        picture = "https://storage.googleapis.com" + rows.file_path
    )

@action('notify_delete', method="POST")
@action.uses(url_signer.verify(), db)
def notify_delete():
    user = auth.get_user()
    file_path = request.json.get("file_path")
    # We check that the owner matches to prevent DDOS.
    db((db.profile.user == user.get('id')) &
       (db.profile.file_path == file_path)).delete()
    return dict()

def delete_path(file_path):
    """Deletes a file given the path, without giving error if the file
    is missing."""
    try:
        bucket, id = os.path.split(file_path)
        gcs.delete(bucket[1:], id)
    except:
        # Ignores errors due to missing file.
        pass

def delete_previous_uploads():
    """Deletes all previous uploads for a user, to be ready to upload a new file."""
    user = auth.get_user()
    previous = db(db.profile.user == user.get('id')).select()
    for p in previous:
        # There should be only one, but let's delete them all.
        delete_path(p.file_path)
    db(db.profile.user == user.get('id')).delete()

def mark_possible_upload(file_path):
    """Marks that a file might be uploaded next."""
    user1 = auth.get_user()
    delete_previous_uploads()
    db.profile.insert(
        username = user1.get('username'),
        file_path=file_path,
        confirmed=False,
    )