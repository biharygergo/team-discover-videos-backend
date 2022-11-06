# What is this?

During the last 48 hours, we've created 3 main applications: a Renderer Backend (this repository), a Video Editor [Frontend](https://github.com/biharygergo/team-discover-videos) and a Telegram Bot.

You can read more in the Frontend app's README. This repository contains our backend, which is an Express application. It relies heavily on files accessible on the server machine. The required folder structure is the following: 

```
data
    assets
        images
            public_images.jpeg
        videos
            public_videos.mp4
        music
            public_music.mp3
        thumbnails
            video_thumbnail.jpeg
        sandbox
            source files used by a Sandbox projects, e.g.: videos, music, images
    projects
        [projectId]
            original
                project.xml
            versions
                [versionId].xml
        sandbox
            original
                project.xml
            versions
                [versionId].xml
    queue
        *.xml files queued by Media Encoder
```

In order to make this app work, you'll need an existing Premiere Pro XML exported and placed either in sandbox (used by the demo) or in a [projectId/original/project.xml] location. You'll also need to make sure the XML references files that are available on the same exact path locally, so the renderer can succeed.

Enjoy!

[DEMO APP](https://bit.ly/TeamDiscover)

# Configuration
There is an environment file `service_account.json` that needs to contain the API key for Google Cloud. Otherwise the `translate` command will not work.

## Team

Good friends from Hungary, having fun at hackathons:)