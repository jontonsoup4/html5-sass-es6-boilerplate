"use strict";

// General
var gulp = require("gulp");
var babel = require("gulp-babel");
var browserSync = require("browser-sync").create();
var del = require("del");
var htmlmin = require("gulp-htmlmin");
var plumber = require("gulp-plumber");
var reload = browserSync.reload;
var ghPages = require("gulp-gh-pages");

// Scripts and tests
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

// Paths to project folders
var paths = {
    input: "src/**/*",
    output: "dist",
    ignoredFolders: [
        "!src/images/**/*",
        "!src/scripts/**/*",
        "!src/static/**/*",
        "!src/styles/**/*",
        "!src/svgs/**/*"
    ],
    images: {
        input: "src/img/**/*",
        output: "dist/img/"
    },
    scripts: {
        input: "src/js/**/*",
        output: "dist/js/"
    },
    static: {
        input: "src/static/**/*.html",
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
// Build all
gulp.task("build", [
    "clean",
    "copy",
    "build:images",
    "build:scripts",
    "build:static",
    "build:styles",
    "build:svgs"
]);

// Copy and optimize image files into output folder
gulp.task("build:images", function() {
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
gulp.task("build:scripts", ["lint"], function() {
    return gulp.src(paths.scripts.input)
        .pipe(plumber())
        .pipe(babel({
            presets: ["es2016"]
        }))
        .pipe(uglify({
            mangle: {toplevel: true}
        }))
        .pipe(gulp.dest(paths.scripts.output));
});

// Copy and minify static files into output folder
gulp.task("build:static", function() {
    return gulp.src(paths.static.input)
        .pipe(plumber())
        .pipe(htmlmin({
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
            removeComments: true
        }))
        .pipe(gulp.dest(paths.static.output))
        .pipe(reload({stream:true}));
});

// Process, lint, and minify style files
gulp.task("build:styles", function() {
    return gulp.src(paths.styles.input)
        .pipe(plumber())
        .pipe(sass()).on("error", sass.logError)
        .pipe(prefix({
            browsers: ["last 2 version", "> 1%"],
            cascade: false
        }))
        .pipe(minify({discardComments: {removeAll: true}}))
        .pipe(gulp.dest(paths.styles.output))
        .pipe(reload({stream:true}));
});

// Clean and copy SVGs
gulp.task("build:svgs", function () {
    return gulp.src(paths.svgs.input)
        .pipe(plumber())
        .pipe(svgmin())
        .pipe(gulp.dest(paths.svgs.output))
        .pipe(reload({stream:true}));
});

// Clean folders
gulp.task("clean", function () {
    del.sync([
        paths.output
    ]);
});

// Copy all other folders
gulp.task("copy", function () {
    return gulp.src([paths.input] + paths.ignoreFolders)
        .pipe(gulp.dest(paths.output))
        .pipe(reload({stream:true}));
});

// Default
gulp.task("default", [
    "build",
    "serve"
]);

// Deploy to Github
gulp.task("deploy", ["build"], function () {
    return gulp.src(paths.output)
        .pipe(ghPages({force: true}));
});

// Lint scripts
gulp.task("lint", function () {
    return gulp.src(paths.scripts.input)
        .pipe(plumber())
        .pipe(jshint())
        .pipe(jshint.reporter("jshint-stylish"));
});

// Serve
gulp.task("serve", ["watch"], function () {
    browserSync.init({
        server: "dist"
    });
});

// Watch all files
gulp.task("watch", function () {
    gulp.watch([paths.input, paths.ignoredFolders], ["copy"])
    gulp.watch(paths.images.input, ["build:images"]);
    gulp.watch(paths.scripts.input, ["build:scripts"]);
    gulp.watch(paths.static.input, ["build:static"]);
    gulp.watch(paths.styles.input, ["build:styles"]);
    gulp.watch(paths.svgs.input, ["build:svgs"]);
});
