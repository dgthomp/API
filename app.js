const APIController = (function (){
    const clientId = '';
    const clientSecret = '';

    //Private Methods
    const _getToken = async () => {
        
        const result = await fetch ('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Authorization' : 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await result.json();
        return data.access_token;

    }

    const _getGenres = async(token) =>{
        const result = await fetch(`https://api.spotify.com/v1/browse/categories?locale=sv_US`, {
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data.categories.items;
    }



    const _getPlayListByGenre = async (token, genreId) =>{

        const limit = 10;

        const result = await fetch(`https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`,{
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token}
        });

        const data = await result.json();
        return data.playlists.items;
    }

    const _getTracks = async (token, tracksEndPoint) =>{

        const limit = 10;
        const result = await fetch(`${tracksEndPoint}?limit=${limit}`,{
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token} 
        });
        const data = await result.json();
        return data.items;
    }

    const _getTrack = async (token, trackEndPoint) =>{
        const result = await fetch(`${trackEndPoint}`,{
            method: 'GET',
            headers: { 'Authorization' : 'Bearer ' + token} 
        });
        const data = await result.json();
        return data;
    }
     return {
        getToken(){
        return _getToken();
        },

        getGenres(token){
        return _getGenres(token);
        },

        getPlayListByGenre (token, genreId){
            return _getPlayListByGenre(token, genreId);
        },

        getTracks(token, tracksEndPoint){
            return _getTracks(token, tracksEndPoint);
        },

        getTrack(token, trackEndPoint){
            return _getTrack(token, trackEndPoint);
        }

    }
})();

//UI Module

const UIController = (function (){
    //Object to hold references to html selectors

    const DOMElements = {
        selectGenre: '#select_genre',
        selectPlaylist: '#select_playlist',
        buttonSubmit: '#btn_submit',
        divSongDetail: '#song-detail',
        hfToken: '#hidden_token',
        divSonglist: '#song-list'
    }
    //public methods

    return{
        //method to get input fields
        inputField () { 
            return {
                genre: document.querySelector(DOMElements.selectGenre),
                playlist: document.querySelector(DOMElements.selectPlaylist),
                tracks: document.querySelector(DOMElements.divSonglist),
                submit: document.querySelector(DOMElements.buttonSubmit),
                SongDetail: document.querySelector(DOMElements.divSongDetail)
                
            }
        },
        
        //methods to create select list option
        
        createGenre (text, value) {
            const html = `<option value ="${value}">${text}`;
            return document.querySelector(DOMElements.selectGenre).insertAdjacentHTML('beforeend', html);

        },

        createPlaylist(text, value){
           
            const html = `<option value = "${value}">${text}`;
            UIController.inputField().playlist.insertAdjacentHTML('beforeend', html)

        },

        //method to create track list group item
        createTrack(id, name){
            const html = `<a class="list-group-item list-group-item-action list-group-item-light" id="${id}">${name}`
            document.querySelector(DOMElements.divSonglist).insertAdjacentHTML('beforeend', html)


        },

        //method to create song detail

        createTrackDetail(img, title, artist){

            const detailDiv = document.querySelector(DOMElements.divSongDetail);
            //detailDiv.innerHTML ='';

            const html = `
            <div class="col-sm-12 px-0">
                <img src="${img}" alt="">
            </div>
            
                <label for="Genre" class="form-label col-sm-12">Title: ${title}</label>
            
                <label for="artist" class="form-label col-sm-12">By: ${artist}</label>
            `;
            document.querySelector(DOMElements.divSongDetail).insertAdjacentHTML("beforeend", html)
        },
        
        resetTrackDetail(){
            UIController.inputField().SongDetail.innerHTML='';
        },

        resetTracks(){
         UIController.inputField().tracks.innerHTML ='';
            //this.resetTrackDetail();
        },

        resetPlayList(){
            UIController.inputField().playlist.innerHTML='';
            //this.resetTracks();
        },
        storeToken(value){
            document.querySelector(DOMElements.hfToken).value = value;
        },
        getStoredToken() {
            return{
            token: document.querySelector(DOMElements.hfToken).value
        }
    }
}
})();

// create controller to handle request from the UI to the API model
const APPController = (function (UICtrl, APICtrl){
    //get input field object ref
    const DOMInputs = UICtrl.inputField();
    //get genres on page load
    const loadGenres = async () =>{
        //get token
        const token = await APICtrl.getToken();
    //store token on page
    UICtrl.storeToken(token);
    //get genres
    const genres = await APICtrl.getGenres(token);
    //load genre select list
    genres.forEach(element => {UICtrl.createGenre(element.name, element.id)});
    
}

//create genre change event listener

DOMInputs.genre.addEventListener('change', async () => {

    //when user changes genre, reset playlist
    UICtrl.resetPlayList();
    UICtrl.resetTrackDetail();

    //store token to reduce calls on API for token
    const token = UICtrl.getStoredToken().token;
    //get the genre select field
    const genreSelect = UICtrl.inputField().genre;
    //get genre id
    const genreId = genreSelect.value; 
    //get playlist data base on genre selected
    const playlist = await APICtrl.getPlayListByGenre(token, genreId);
    //load playlist
   playlist.forEach(p => UICtrl.createPlaylist(p.name, p.tracks.href));

});

DOMInputs.submit.addEventListener('click', async(e) =>{
    //prevent page reset
    e.preventDefault();
     UICtrl.resetTracks();
    UICtrl.resetTrackDetail();
    // get the token
    const token = UICtrl.getStoredToken().token;
    // get the track endpoint
    const tracksEndpoint = UICtrl.inputField().playlist.value;//get the track object
    
    const tracks = await APICtrl.getTracks(token, tracksEndpoint);
   
     tracks.forEach(t => UICtrl.createTrack(t.track.href, t.track.name));
    
  
});    
DOMInputs.tracks.addEventListener('click', async(e) =>{
    //prevent page reset
    e.preventDefault();
     UICtrl.resetTrackDetail();
    // get the token
    const token = UICtrl.getStoredToken().token;
    // get the track endpoint
    const trackEndpoint = e.target.id;//get the track object
    
    const track = await APICtrl.getTrack(token, trackEndpoint);
    
    
    // load the track details
   UICtrl.createTrackDetail(track.album.images[1].url,track.name,track.artists[0].name);
});    

return {
    init() {
       
        loadGenres();
    }
}

})(UIController, APIController);

// will need to call a method to load the genres on page load
APPController.init();
