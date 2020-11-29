// to define a Gulp-Task:
// const gulp = require('gulp');
// function taskFn(cb) {
//     // Stuff here
//     cb();
// }
// gulp.task('task-name', taskFn);


const gulp = require("gulp");// the minimum content to use gulp:

const del = require("del");
const sass = require("gulp-sass");
const rename = require("gulp-rename");
const gulpif = require("gulp-if");
const htmlreplace = require("gulp-html-replace");
const autoprefixer = require("gulp-autoprefixer");
const cssnano = require("gulp-cssnano");
const uglify = require("gulp-uglify-es").default;
const browserSync = require("browser-sync").create();
// the rollup, babel and resolveNodeModules are for Bundling:
const rollup = require("gulp-better-rollup");
const babel = require("rollup-plugin-babel");
const resolveNodeModules = require("rollup-plugin-node-resolve");

let isProductionBuild = false;

// start with functions:
function runSass() {
    return gulp
        .src("src/scss/**/*.scss")
        .pipe(sass())
        .pipe(autoprefixer())
        .pipe(gulpif(isProductionBuild, cssnano()))
        .pipe(
            gulpif(
                isProductionBuild,
                rename({
                    suffix: ".min",
                })
            )
        )
        .pipe(
            gulpif(isProductionBuild, gulp.dest("dist/css/"), gulp.dest("src/css/"))
        )
        .pipe(browserSync.stream());
}



function reloadBrowser(done) {
    browserSync.reload();
    done();
}

function bundleJs() {
    return gulp
        .src("src/js/main.js")
        .pipe(
            rollup(
                {
                    plugins: [babel(), resolveNodeModules()],
                },
                { format: "cjs" }
            )
        )
        .pipe(gulpif(isProductionBuild, uglify()))
        .pipe(
            gulpif(
                isProductionBuild,
                rename({
                    suffix: ".min",
                }),
                rename({
                    suffix: "-bundle",
                })
            )
        )
        .pipe(
            gulpif(isProductionBuild, gulp.dest("dist/js/"), gulp.dest("src/js/"))
        );
}

function runWatch() {
    startBrowserSync();
    gulp.watch("src/scss/**/*.scss", runSass);
    gulp.watch("src/**/*.html", reloadBrowser);
    gulp.watch(
        ["src/js/**/*.js", "!src/js/**/*-bundle.js"],
        gulp.series(bundleJs, reloadBrowser)
    );
}

function startBrowserSync() {
    browserSync.init({
        server: {
            baseDir: "src",
        },
    });
}
// to move all images to dist
function copyImages() {
    return gulp.src("src/images/**/*.*").pipe(gulp.dest("dist/images/"));
}

// to move all fonts to dist
function copyfonts() {
    return gulp.src("src/fonts/*.*").pipe(gulp.dest("dist/fonts/"));
}

function copyHtml() {
    return gulp
        .src("src/**/*.html")
        .pipe(
            htmlreplace({
                js: "js/main.min.js",
                css: "css/style.min.css",
            })
        )
        .pipe(gulp.dest("dist/"));
}

function runClean(done) {
    del.sync("dist");
    done();
}

function startProductionBuild(done) {
    isProductionBuild = true;
    done();
}

gulp.task("sass", runSass);
gulp.task("sass:build", gulp.series(startProductionBuild, runSass));
gulp.task("bundle", bundleJs);
gulp.task("bundle:build", gulp.series(startProductionBuild, bundleJs));
gulp.task("watch", gulp.series(runSass, bundleJs, runWatch));

gulp.task(
    "build",
    gulp.series(
        startProductionBuild,
        runClean,
        gulp.parallel(copyHtml, runSass, bundleJs, copyImages, copyfonts)
    )
);