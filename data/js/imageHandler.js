var ImageHandler = {
    s3Upload: function(imageUuid, challengeId) {
        var status_elem = document.getElementById("status");
        var url_elem = document.getElementById("userImageURL");
        var preview_elem = document.getElementById("preview");

        var s3upload = new S3Upload({
            file_dom_selector: 'file',
            s3_sign_put_url: '/sign_s3/',
            s3_object_name: imageUuid,

            onProgress: function(percent, message) {
                status_elem.innerHTML = 'Upload progress: ' + percent + '% ' + message;
            },

            onFinishS3Put: function(url) {
                status_elem.innerHTML = 'Upload completed. Uploaded to: '+ url;
                preview_elem.innerHTML = '<img src="'+url+'" style="width:300px;" />';
                ImageHandler.saveUserProgress(imageUuid, challengeId);
            },

            onError: function(status) {
                status_elem.innerHTML = 'Upload error: ' + status;
            }
        });    
    },

    saveUserProgress: function(imageUuid, challengeId) {
        var progress = new palate.ChallengeUserProgress({
            userId: 0,
            challengeId: challengeId,
            imageUuid: imageUuid
        });
        progress.save();
    },

    completeStep: function() {
        var challengeId = parseInt(document.querySelector("#feedChallengeId").value);
        var image = new palate.Image();
        image.save({});
        image.on('sync', function() {
            ImageHandler.s3Upload(image.attributes.uuid, challengeId);    
        });
    }
}