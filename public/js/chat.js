const socket = io();

//elements
const form = document.querySelector(".msg-form");
const msgInput = document.querySelector("#msg-input");
const msgBtn = document.querySelector("#btn-msg");
const locationBtn = document.querySelector("#btn-loc");
const messages = document.querySelector("#messages");
const sideBarChat = document.querySelector(".chat__sidebar");

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sentMsgTemplate = document.querySelector(
  "#sent-message-template"
).innerHTML;
const siderbarTemplate = document.querySelector("#sidebar-template").innerHTML;

//options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

//autoscroll
const autoScroll = () => {
  //new message element
  const newMessage = messages.lastElementChild;

  //height of new message element
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  //visible height
  const visibleHeight = messages.offsetHeight;

  //height of message container
  const messageContainerHeight = messages.scrollHeight;

  //manually scrolled height
  const scrollTop = messages.scrollTop;
  const scrollOffset = scrollTop + visibleHeight;

  if (messageContainerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on("message", ({ text, createdAt }, username) => {
  const html = Mustache.render(messageTemplate, {
    message: text,
    createdAt,
    username,
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationLink", ({ url, createdAt }, username) => {
  const html = Mustache.render(locationTemplate, { url, createdAt, username });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("allUsers", ({ users, room }) => {
  const html = Mustache.render(siderbarTemplate, { room, users });
  sideBarChat.innerHTML = html;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  msgBtn.setAttribute("disabled", "disabled");
  socket.emit("clientMessage", msgInput.value, ({ status, optionalMsg }) => {
    if (optionalMsg !== null) {
      alert(optionalMsg);
    }
    const html = Mustache.render(sentMsgTemplate, {
      message: msgInput.value,
      createdAt: new Date().toLocaleTimeString(),
      username: "Me",
      //   status,
    });

    messages.insertAdjacentHTML("beforeend", html);
    autoScroll();

    msgBtn.removeAttribute("disabled");
    msgInput.value = "";
    msgInput.focus();
  });
});

locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("geolocation not supported by browser!");
  }

  locationBtn.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    const coord = {
      lat: position.coords.latitude,
      long: position.coords.longitude,
    };
    socket.emit("location", coord, () => {
      const html = Mustache.render(sentMsgTemplate, {
        message: `You shared your location`,
        createdAt: new Date().toLocaleTimeString(),
        username: "Me",
      });
      messages.insertAdjacentHTML("beforeend", html);
      autoScroll();
      locationBtn.removeAttribute("disabled");
    });
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
