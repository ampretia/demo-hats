'use strict';

let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
// let logger = require('morgan');

let _ = require('lodash');

let app = express();

// view engine setup
app.set('views', path.join(__dirname,'..', 'views'));
app.set('view engine', 'hbs');

//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..','public')));
app.get('/welcome', function(req, res, next) {
    let keys = _.chunk(Object.keys(app.get('cfg')),4);
    // now we have an array of rows, form this into an object
    let data=[];
    for (let row of keys){
        let rowData = {data:[]};
        for (let e of row){
            let viewData = _.cloneDeep(app.get('cfg')[e]);
            delete viewData.page;
            viewData.id = e;
            rowData.data.push(viewData);
        }
        data.push(rowData);
    }

    // console.log(jsome.getColoredString(data));

    res.render('welcome', { title: 'Demo Hats Control', cfg: data, info:app.get('info') });
});
app.get('/', function(req, res, next) {
    let keys = _.chunk(Object.keys(app.get('cfg')),4);
    // now we have an array of rows, form this into an object
    let data=[];
    for (let row of keys){
        let rowData = {data:[]};
        for (let e of row){
            let viewData = _.cloneDeep(app.get('cfg')[e]);
            delete viewData.page;
            viewData.id = e;
            rowData.data.push(viewData);
        }
        data.push(rowData);
    }

    // console.log(jsome.getColoredString(data));

    res.render('index', { title: 'Demo Hats Control', cfg: data, info:app.get('info')  });
});



app.get('/users/:userId/', function (req, res) {
    let data = (app.get('cfg'))[req.params.userId];
    res.render('users', { who: req.params.userId, cfg:data });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
