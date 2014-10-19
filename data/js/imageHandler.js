var ImageHandler = {
    s3Upload: function(image) {
        var status_elem = document.getElementById("status");
        var url_elem = document.getElementById("userImageURL");
        var preview_elem = document.getElementById("preview");

        var s3upload = new S3Upload({
            file_dom_selector: 'file',
            s3_sign_put_url: '/sign_s3/',
            s3_object_name: image.uuid,

            onProgress: function(percent, message) {
                status_elem.innerHTML = 'Upload progress: ' + percent + '% ' + message;
            },
            onFinishS3Put: function(url) {
                status_elem.innerHTML = 'Upload completed. Uploaded to: '+ url;
                preview_elem.innerHTML = '<img src="'+url+'" style="width:300px;" />';
                ImageHandler.saveUserProgress(image);
            },
            onError: function(status) {
                status_elem.innerHTML = 'Upload error: ' + status;
            }
        });    
    },

    saveUserProgress: function(image) {

    },

    completeStep: function() {
        image = new Palate.Image();
        // since the id is not set, this will create the image
        // the server will populate the uuid
        image.save();

        s3Upload(image);
    }
}