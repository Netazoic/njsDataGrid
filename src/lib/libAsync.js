import $ from 'jquery';
import axios from 'axios';
import Vue from 'vue';
import asyncTicator from './asyncTicator.vue'
const libAsync = {
    xhrGet,
    xhrSubmit,
    asyncIndicator,
    setupAxiosIndicators
};

export default libAsync;

let asyncticator;

function asyncIndicator(flg, mountPoint) {
    // console.log("asyncIndicator: " + flg);
    if (!mountPoint) mountPoint = "asyncticator-mount";

    if (!asyncticator) {
        let div = document.getElementById(mountPoint);
        if (!div) {
            div = document.createElement('div', { id: mountPoint });
            document.body.append(div);
        }
        let ctor = Vue.extend(asyncTicator);  //make a component
        asyncticator = new ctor({
            propsData: { flgVisible: false }
        });
        asyncticator.$mount("#" + mountPoint);
    }
    asyncticator.flgVisible = flg;
    // Or, with jQuery:
    // if (flg) $('#ajaxAction').fadeIn();
    // else $('#ajaxAction').fadeOut();
}
function setupAxiosIndicators(instance, mountPoint) {
    instance.interceptors.request.use(
        config => {
            // trigger 'loading=true' event here
            asyncIndicator(true);
            return config;
        },
        error => {
            // trigger 'loading=false' event here
            asyncIndicator(false);
            return Promise.reject(error);
        }
    );

    instance.interceptors.response.use(
        response => {
            // trigger 'loading=false' event here
            asyncIndicator(false);
            return response;
        },
        error => {
            // trigger 'loading=false' event here
            asyncIndicator(false);
            return Promise.reject(error);
        }
    );
}

function constructURL(action, args) {
    let url = action;
    let qString;
    if (args) {
        qString = '';
        Object.keys(args).forEach(function(k) {
            if (args[k] != null) qString += '&' + k + '=' + args[k];
        });
    }
    if (qString) {
        if (url.indexOf('?') > 0) url += qString;
        else url += '?qs=true' + qString;
    }
    return url;
}

export function xhrGet(action, args, fLoad, fErr, axInst) {
    if (!axInst) {
        axInst = axios.create();
        setupAxiosIndicators(axInst);
    }

    const url = constructURL(action, args);
    const config = {
        method: 'get',
        // `headers` are custom headers to be sent
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    };
    try {
        return axInst.get(url, config).then(function(resp) {
            if (fLoad) {
                fLoad(resp);
            }
            return resp;
        });
    } catch (err) {
        if (typeof err == 'object') {
            if (err.response) {
                if (err.response.data) {
                    err.message = err.response.data;
                }
            }
        }
        throw err;
    }
}

export function xhrSubmit(fd, url, fLoad, fErr, axInst) {
    if (!axInst) {
        axInst = axios.create();
        setupAxiosIndicators(axInst);
    }
    if (!fd.set) fd = new FormData(fd);
    fd.set("xhr", true);
    var config = {
        headers: {
            'Content-Type': undefined, //browser will create content-type automatically
            'X-Requested-With': 'XMLHttpRequest'
        }
    };
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded'; //actually, let's try setting it
    // Actually, axios will obstinately change the Content-Type to multipart/form-data for reasons
    // only it seems to understand.  Check the Request Headers in chrome dev tools or equiv.
    // Therefore the recieving servlet must have the @MultipartConfig annotation
    return axInst({
        method: 'post',
        url: url,
        data: fd,
        config: config
    })
        .then(function(resp) {
            if (fLoad) fLoad(resp);
            return resp;
        })
        .catch(function(err) {
            if (fErr) fErr(err);
            else {
                if (typeof err == 'object') {
                    if (err.response && err.response.data) {
                        if (err.response.data.indexOf("<") != 0) //Don't use html responses as error messages
                            err.message = err.response.data;
                    }
                }
            }
            throw err;
        });
}
