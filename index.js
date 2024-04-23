/* === Imports === */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, serverTimestamp, onSnapshot, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import {    getAuth, 
            createUserWithEmailAndPassword, 
            signInWithEmailAndPassword,
            signOut,
            onAuthStateChanged,
            GoogleAuthProvider,
            signInWithPopup,
            updateProfile 
        } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js"

/* === Firebase Setup === */
const firebaseConfig = {
    apiKey: "AIzaSyCYOrv-6yPmHj4RouhN_q3g8-JA2F3jm8g",
    authDomain: "moody-c7c1b.firebaseapp.com",
    projectId: "moody-c7c1b",
    storageBucket: "moody-c7c1b.appspot.com",
    messagingSenderId: "206949002174",
    appId: "1:206949002174:web:b9a5858074aa3575bde7ef"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const provider = new GoogleAuthProvider();
const db = getFirestore(app);


/* === UI === */

/* == UI - Elements == */

const viewLoggedOut = document.getElementById("logged-out-view")
const viewLoggedIn = document.getElementById("logged-in-view")

const signInWithGoogleButtonEl = document.getElementById("sign-in-with-google-btn")

const emailInputEl = document.getElementById("email-input")
const passwordInputEl = document.getElementById("password-input")

const signInButtonEl = document.getElementById("sign-in-btn")
const signOutButtonEl = document.getElementById("sign-out-btn")
const createAccountButtonEl = document.getElementById("create-account-btn")

const userProfilePictureEl = document.getElementById("user-profile-picture")
const userGreetingEl = document.getElementById("user-greeting")

const displayNameInputEl = document.getElementById("display-name-input")
const photoURLInputEl = document.getElementById("photo-url-input")
const updateProfileButtonEl = document.getElementById("update-profile-btn")

const textareaEl = document.getElementById('post-input');
const postButtonEl = document.getElementById('post-btn');
const moodEmojiEls = document.getElementsByClassName('mood-emoji-btn');

const postsEl = document.getElementById('posts');
//const fetchPostsButtonEl = document.getElementById('fetch-posts-btn');

const allFilterButtonEl = document.getElementById("all-filter-btn")

const filterButtonEls = document.getElementsByClassName("filter-btn")

/* == UI - Event Listeners == */

signInWithGoogleButtonEl.addEventListener("click", authSignInWithGoogle)

signInButtonEl.addEventListener("click", authSignInWithEmail)
signOutButtonEl.addEventListener("click", authSignOut)
createAccountButtonEl.addEventListener("click", authCreateAccountWithEmail)
//updateProfileButtonEl.addEventListener("click", authUpdateProfile)

for (let moodEmojiEl of moodEmojiEls) {
    moodEmojiEl.addEventListener("click", selectMood)
}

for (let filterButtonEl of filterButtonEls) {
    filterButtonEl.addEventListener("click", selectFilter)
}

postButtonEl.addEventListener("click", postButtonPressed)
//fetchPostsButtonEl.addEventListener("click", fetchOnceAndRenderPostsFromDB)

/* === State === */
let moodState = 0;

/* === Global Constants */
let collectionName = 'posts'

/* === Main Code === */

onAuthStateChanged(auth, (user) => {
    if (user) {
        showLoggedInView()
        showProfilePicture(userProfilePictureEl, user)
        showUserGreeting(userGreetingEl, user)
        //fetchInRealTimeAndRenderPostsFromDB(user)
    } else {
        showLoggedOutView()
    }
  });

/* === Functions === */

/* = Functions - Firebase - Authentication = */

function authSignInWithGoogle() {
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Sign in with Google")
        }).catch((error) => {
            console.error(error.message)
        });
    
}

function authSignInWithEmail() {
    const email = emailInputEl.value;
    const password = passwordInputEl.value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            clearAuthFields()
        })
        .catch((error) => {
            console.error(error.message);
        })
}

function authCreateAccountWithEmail() {
    const email = emailInputEl.value;
    const password = passwordInputEl.value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            clearAuthFields()
        })
        .catch((error) => {
            console.error(error.message);
        })
}

function authSignOut(){
    signOut(auth).then(() => {
    }).catch((error) => {
        console.error(error.message);
    })
}

function authUpdateProfile() {
    const newDisplayName = displayNameInputEl.value
    const newPhotoURL = photoURLInputEl.value

    updateProfile(auth.currentUser, {
        displayName: newDisplayName,
        photoURL: newPhotoURL
      }).then(() => {
        console.log('Profile updated')
      }).catch((error) => {
        console.error(error.message)
      });
}
/* == Functions - Firebase - Cloud Firestore == */

async function addPostToDB(postBody, user) {
    try {
        const documentID = await addDoc(collection(db, collectionName), {
          body: postBody,
          uid: user.uid,
          createdAt:serverTimestamp(),
          mood: moodState
        });
        console.log("Document written with ID: ", documentID);
      } catch (error) {
        console.error(error.message);
      }
}

function displayDate(firebaseDate) {
    if(!firebaseDate) {
        return "Date processing..."
    }
    const date = firebaseDate.toDate();
    const day = date.getDate()
    const year = date.getFullYear()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const months = monthNames[date.getMonth()]
    let hours = date.getHours()
    let minutes = date.getMinutes()
    hours = hours < 10 ? "0" + hours : hours
    minutes = minutes < 10 ? "0" + minutes : minutes

    return `${day} ${months} ${year} - ${hours}:${minutes}`
}

/* async function fetchOnceAndRenderPostsFromDB() {
    const querySnapshot = await getDocs(collection(db, "posts"));
    clearAll(postsEl)
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id}: ${doc.data().body}`);
      renderPost(postsEl, doc.data())
    });
} */

function fetchInRealTimeAndRenderPostsFromDB(query, user) {
    onSnapshot(query, (querySnapshot) => {
        clearAll(postsEl)
        querySnapshot.forEach((doc) => {
            renderPost(postsEl, doc.data())
           //console.log(doc.data())
        })
    })
}

function fetchTodayPosts(user) {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const postsRef = collection(db, collectionName)

    const q = query(postsRef, where('uid', '==', user.uid), 
                              where ('createdAt', '>=', startOfDay),
                              where ('createdAt', '<=', endOfDay),
                              orderBy ('createdAt', 'desc'))
    fetchInRealTimeAndRenderPostsFromDB(q, user)
}


function fetchWeekPosts(user) {
    const startOfWeek = new Date()
    startOfWeek.setHours(0, 0, 0, 0)

    if (startOfWeek.getDate() === 0) {
        // If today is Sunday, minus 6 to go to the previous Monday
        startOfWeek.setDate(startOfWeek.getDate() - 6)
    } else {
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDate() + 1)
    }
}

function renderPost(postsEl, postData) {
    postsEl.innerHTML +=
    `
        <div class="post">
            <div class="header">
                <h3>${displayDate(postData.createdAt)}</h3>
                <img src="assets/emojis/${postData.mood}.png">
            </div>
            <p>
                ${replaceNewlinesWithBrTags(postData.body)}
            </p>
        </div>
    `
}

/* == Functions - UI Functions == */
function replaceNewlinesWithBrTags(inputString) {
    return inputString.replace(/\n/g, "<br>")
}

function postButtonPressed() {
    const postBody = textareaEl.value;
    const user = auth.currentUser;

    if(postBody && moodState) {
        addPostToDB(postBody, user)
        clearInputField(textareaEl)
        resetAllMoodElements(moodEmojiEls)
    }
}

function clearAll(element) {
    element.innerHTML = ""
}

function showLoggedOutView() {
    hideView(viewLoggedIn)
    showView(viewLoggedOut)
}

function showLoggedInView() {
    hideView(viewLoggedOut)
    showView(viewLoggedIn)
}

function showView(view) {
    view.style.display = "flex"
}

function hideView(view) {
    view.style.display = "none"
}

function clearInputField(field) {
    field.value = ""
}

function clearAuthFields() {
    clearInputField(emailInputEl)
    clearInputField(passwordInputEl)
}

function showProfilePicture(imgElement, user) {
    const photoURL = user.photoURL;

    if (photoURL) {
    imgElement.src=photoURL
    } else {
        imgElement.src="assets/images/default.jpg"
    }

}

function showUserGreeting(element, user) {
    const displayName = user.displayName;

    if (displayName) {
        const userFirstName = displayName.split(' ')[0]
        element.textContent = `Hey ${userFirstName}, how are you?`
    } else {
        element.textContent = `Hey friend, how are you?`
    }

}

function selectMood(event) {
    const selectedMoodEmojiElementId = event.currentTarget.id

    changeMoodsStyleAfterSelection(selectedMoodEmojiElementId, moodEmojiEls)

    const chosenMoodValue = returnMoodValueFromElementId(selectedMoodEmojiElementId)

    moodState = chosenMoodValue
}

function changeMoodsStyleAfterSelection(selectedMoodEmojiElementId, allMoodElements) {
    for (let moodEmojiEl of moodEmojiEls) {
        if(selectedMoodEmojiElementId === moodEmojiEl.id) {
            moodEmojiEl.classList.remove("unselected-emoji")
            moodEmojiEl.classList.add("selected-emoji")
        } else {
            moodEmojiEl.classList.remove("selected-emoji")
            moodEmojiEl.classList.add("unselected-emoji")
        }
    }
}

function resetAllMoodElements(allMoodElements) {
    for (let moodEmojiEl of moodEmojiEls) {
        moodEmojiEl.classList.remove("unselected-emoji")
        moodEmojiEl.classList.remove("selected-emoji")
    }
    moodState = 0
}

function returnMoodValueFromElementId(elementId) {
    return Number(elementId.slice(5))
}

function resetAllFilterButtons(allFilterButtons) {
    for (let filterButtonEl of allFilterButtons) {
        filterButtonEl.classList.remove('selected-filter')
    }
}

function updateFilterButtonStyle(element) {
    element.classList.add('selected-filter')
}

function selectFilter(event) {
    const user = auth.currentUser
    const selectedFilterElementId = event.target.id
    const selectedFilterPeriod = selectedFilterElementId.split('-')[0]
    const selectedFilterElement = document.getElementById(selectedFilterElementId)

    resetAllFilterButtons(filterButtonEls)

    updateFilterButtonStyle(selectedFilterElement)

    fetchTodayPosts(user)
}