var commonOptions = {};
commonOptions.apiKey = "61440426-0d89-42b2-88fe-a0375531855f";
commonOptions.appName = "voting-app";
const url = window.location.href;
const domainName = url.substring(0, url.lastIndexOf("/"));
const params = url.split("?")[1];
