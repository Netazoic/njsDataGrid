import $ from 'jquery';
import axios from 'axios';

const libAsync = {
    xhrGet,
    xhrSubmit
};
export default libAsync;

function asyncIndicator(flg) {
    if (flg) $('#ajaxAction').fadeIn();
    else $('#ajaxAction').fadeOut();
}

function constructURL(action, args) {
    let url = action;
    let qString;
    //debugger;
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

export function xhrGet(action, args, fLoad) {
    const url = constructURL(action, args);
    asyncIndicator(true);
    const config = {
        method: 'get',
        // `headers` are custom headers to be sent
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    };
    try {
        return axios.get(url, config).then(function(resp) {
            if (fLoad) {
                fLoad(resp);
            }
            asyncIndicator(false);
            return resp;
        });
    } catch (err) {
        asyncIndicator(false);
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

export function xhrSubmit(fd, url, fLoad, fErr) {
    asyncIndicator(true);
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
    return axios({
        method: 'post',
        url: url,
        data: fd,
        config: config
    })
        .then(function(resp) {
            asyncIndicator(false);
            if (fLoad) fLoad(resp);
            return resp;
        })
        .catch(function(err) {
            asyncIndicator(false);
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
