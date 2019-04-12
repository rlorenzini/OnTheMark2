//Will be in the user-page rout

app.get('/comments/:id', (req, res) => {
    let postID = parseInt(req.params.id)
    //Code here
    // res.render('comments', { postID })
    models.Post.findByPk(postID, {
        include: [{
            model: models.Comment,
            as: 'comments'
        }]
    }).then((post) => {
        console.log(post.comments)
        res.render('comments', { post: post })
    })
})