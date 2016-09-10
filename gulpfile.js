"use strict";

// General
var gulp = require("gulp");
var babel = require("gulp-babel");
var browserSync = require("browser-sync").create();
var del = require("del");
var lazypipe = require("lazypipe");
var htmlmin = require("gulp-htmlmin");
var plumber = require("gulp-plumber");
var reload = browserSync.reload;
var tap = require("gulp-tap");
var ghPages = require("gulp-gh-pages");

// Scripts and tests
var concat = require("gulp-concat");
var jshint = require("gulp-jshint");
var stylish = require("jshint-stylish");
var uglify = require("gulp-uglify");

// Styles
var minify = require("gulp-cssnano");
var prefix = require("gulp-autoprefixer");
var sass = require("gulp-sass");

// Images
var imagemin = require("gulp-imagemin");
var svgmin = require("gulp-svgmin");
var svgstore = require("gulp-svgstore");

// Paths to project folders
var paths = {
    input: "src/**/*",
    output: "dist/",
    bower: {
        input: "bower_components/**/*",
        output: "dist/bower_components/"
    },
    fonts: {
        input: "src/fonts/**/*",
        output: "dist/fonts/"
    },
    images: {
        input: "src/img/**/*",
        output: "dist/img/"
    },
    scripts: {
        input: "src/js/**/*",
        output: "dist/js/"
    },
    static: {
        input: "src/static/**/*",
        output: "dist/"
    },
    styles: {
        input: "src/styles/**/*.{scss,sass,css}",
        output: "dist/styles/"
    },
    svgs: {
        input: "src/svg/**/*",
        output: "dist/svg/"
    }
};

// Gulp Tasks
// Move and minify bower components
gulp.task("build:bower", [
    "clean:bower",
    "build:bower-html",
    "build:bower-scripts",
    "build:bower-styles"
], function () {
    reload();
});

gulp.task("build:bower-html", ["clean:bower"], function () {
    return gulp.src(paths.bower.input + ".html")
        .pipe(plumber())
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(paths.bower.output))
});

gulp.task("build:bower-scripts", ["clean:bower"], function () {
    return gulp.src(paths.bower.input + ".js")
        .pipe(plumber())
        .pipe(uglify({
            mangle: {toplevel: true}
        }))
        .pipe(gulp.dest(paths.bower.output))
});

gulp.task("build:bower-styles", ["clean:bower"], function () {
    return gulp.src(paths.bower.input + ".{scss,sass,css}")
        .pipe(plumber())
        .pipe(minify({discardComments: {removeAll: true}}))
        .pipe(gulp.dest(paths.bower.output))
});

// Process fonts
gulp.task("build:fonts", ["clean:fonts"], function () {
    return gulp.src(paths.fonts.input)
        .pipe(plumber())
        .pipe(gulp.dest(paths.fonts.output))
        .pipe(reload({stream:true}));
});

// Copy and optimize image files into output folder
gulp.task("build:images", ["clean:images"], function() {
    return gulp.src(paths.images.input)
        .pipe(plumber())
        .pipe(imagemin({
            progressive: true,
            interlaced: true,
            svgoPlugins: [ {removeViewBox:false}, {removeUselessStrokeAndFill:false} ]
        }))
        .pipe(gulp.dest(paths.images.output))
        .pipe(reload({stream:true}));
});

// Lint, minify, and concatenate scripts
gulp.task("build:scripts", ["clean:scripts", "lint:scripts"], function() {
    var jsTasks = lazypipe()
        .pipe(plumber)
        .pipe(uglify, {mangle: {toplevel: true}})
        .pipe(gulp.dest, paths.scripts.output);

    return gulp.src(paths.scripts.input)
        .pipe(plumber())
        .pipe(babel({
            presets: ["es2015"]
        }))
        .pipe(tap(function (file) {
            if (file.isDirectory()) {
                var name = file.relative + ".js";
                return gulp.src(file.path + "/*.js")
                    .pipe(concat(name))
                    .pipe(jsTasks());
            }
        }))
        .pipe(jsTasks())
        .pipe(reload({stream:true}));
});

// Copy and minify static files into output folder
gulp.task("build:static", ["clean:static"], function() {
    return gulp.src(paths.static.input)
        .pipe(plumber())
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(paths.static.output))
        .pipe(reload({stream:true}));
});

// Process, lint, and minify style files
gulp.task("build:styles", ["clean:styles"], function() {
    return gulp.src(paths.styles.input)
        .pipe(plumber())
        .pipe(sass()).on("error", sass.logError)
        .pipe(prefix({
            browsers: ["last 2 version", "> 1%"],
            cascade: true,
            remove: true
        }))
        .pipe(minify({discardComments: {removeAll: true}}))
        .pipe(gulp.dest(paths.styles.output))
        .pipe(reload({stream:true}));
});

// Generate SVG sprites
gulp.task("build:svgs", ["clean:svgs"], function () {
    return gulp.src(paths.svgs.input)
        .pipe(plumber())
        .pipe(tap(function (file) {
            if (file.isDirectory()) {
                return gulp.src(file.path + "/*.svg")
                    .pipe(svgmin())
                    .pipe(svgstore({
                        inlineSvg: true
                    }))
                    .pipe(gulp.dest(paths.svgs.output));
            }
        }))
        .pipe(svgmin())
        .pipe(gulp.dest(paths.svgs.output))
        .pipe(reload({stream:true}));
});

// Remove pre-existing content from output folders
gulp.task("clean:dist", function () {
    del.sync([
        paths.output
    ]);
});

gulp.task("clean:bower", function () {
    del.sync([
        paths.bower.output
    ]);
});

gulp.task("clean:fonts", function () {
    del.sync([
        paths.fonts.output
    ]);
});

gulp.task("clean:images", function () {
    del.sync([
        paths.images.output
    ]);
});

gulp.task("clean:scripts", function () {
    del.sync([
        paths.scripts.output
    ]);
});

gulp.task("clean:static", function () {
    del.sync([
        "dist/*.*"
    ]);
});

gulp.task("clean:styles", function () {
    del.sync([
        paths.styles.output
    ]);
});

gulp.task("clean:svgs", function () {
    del.sync([
        paths.svgs.output
    ]);
});

// Lint scripts
gulp.task("lint:scripts", function () {
    return gulp.src(paths.scripts.input)
        .pipe(plumber())
        .pipe(jshint())
        .pipe(jshint.reporter("jshint-stylish"));
});

// Watch all files
gulp.task("watch", function () {
    gulp.watch(paths.bower.input, ["build:bower"]);
    gulp.watch(paths.fonts.input, ["build:fonts"]);
    gulp.watch(paths.images.input, ["build:images"]);
    gulp.watch(paths.scripts.input, ["build:scripts"]);
    gulp.watch(paths.static.input, ["build:static"]);
    gulp.watch(paths.styles.input, ["build:styles"]);
    gulp.watch(paths.svgs.input, ["build:svgs"]);
});

// Deploy to Github
gulp.task("deploy", function() {
    return gulp.src("./dist/**/*")
        .pipe(ghPages());
});

// Compile files
gulp.task("build", [
    "clean:dist",
    "build:bower",
    "build:fonts",
    "build:images",
    "build:scripts",
    "build:static",
    "build:styles",
    "build:svgs",
]);

// Serve
gulp.task("serve", ["watch"], function () {
    browserSync.init({
        server: "dist"
    });
});

// Default
gulp.task("default", [
    "build",
    "serve"
]);
