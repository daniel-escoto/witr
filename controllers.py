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

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner

url_signer = URLSigner(session)

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

@action('load_posts')
@action.uses(url_signer.verify(), db)
def load_posts():
    user = auth.get_user() or redirect(URL('auth/login'))
    return dict(rows=db(db.post).select().as_list(),
                email=user.get("email"),)
                
                
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
    id = db.post.insert(
        content=request.json.get('content'),
        first_name=first_name,
        last_name=last_name,
        author_email=email,
        username=username,
        thumbs_up=thumbs_up,
        thumbs_down=thumbs_down,
    )

    return dict(id=id,
                first_name=first_name,
                last_name=last_name,
                email=email,
                username=username,
                thumbs_up=thumbs_up,
                thumbs_down=thumbs_down)

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

@action('upload_picture', method="POST")
@action.uses(url_signer.verify(), db)
def upload_picture():
    prof = request.json.get("profid")
    picture = request.json.get("picture")
    db(db.profile.id == prof).update(picture=picture)
    return "ok"





@action('view/<username>', method=["GET"])
@action.uses(url_signer, auth, db, 'view.html')
def view(username):
    user = auth.get_user() or redirect(URL('auth/login'))
    
    return dict(
        load_user_info_url = URL('load_user_info', username, signer=url_signer),
        load_profposts_url = URL('load_profposts', username, signer=url_signer),
        delete_post_url = URL('delete_post', signer=url_signer),
        upvote_post_url = URL('upvote_post', signer=url_signer),
        downvote_post_url = URL('downvote_post', signer=url_signer),
        get_vote_names_url = URL('get_vote_names', signer=url_signer),
        upload_picture_url = URL('upload_picture', signer=url_signer),
    )

@action('load_user_info/<username>', method=["GET"])
@action.uses(url_signer.verify(), db)
def load_user_info(username):
    user = auth.get_user() 
    #Check for Permissions to allow editing on page
    permission = False
    if user.get('username') == username:
        permission = True
    
    user1 = (db(db.post.username == username)).select().first()
    prof_id = -1
    if permission:
        prof_id = db(db.profile.user == user.get('id')).select().as_list()
        if not prof_id:
            prof_id = db.profile.insert(
                picture = "",
                username = username,
            )
        else:
            prof_id = prof_id[0]['id']

    found_username = user1.username
    found_full_name = user1.first_name + " " + user1.last_name
    picture = db(db.profile.username == username).select().as_list()
    prof = db(db.profile.username == username).select().as_list()
    picture = picture[0]['picture']
    return dict(
        username = found_username,
        full_name = found_full_name,
        picture = picture,
        permission = permission,
        prof_id = prof_id,
        profile = prof
    )