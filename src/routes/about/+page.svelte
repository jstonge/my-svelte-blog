<script>
    import Meta from "$lib/components/Meta.svelte";

     const preloadFont = [
        "/assets/fonts/tiempos/TiemposTextWeb-Regular.woff2",
        "/assets/fonts/tiempos/TiemposTextWeb-Bold.woff2",
        "/assets/fonts/atlas/AtlasGrotesk-Regular-Web.woff2",
        "/assets/fonts/atlas/AtlasGrotesk-Bold-Web.woff2",
        "/assets/fonts/atlas/AtlasTypewriter-Medium-Web.woff2"
    ];
</script>


<Meta
  title="About"
  description="About."
  {preloadFont}
/>


<div class="page">
    <div class="about-layout">
        <div class="left-hand-side">
            <h1>About</h1>


            <p>I'm a research software engineer at the <a href="https://vermontcomplexsystems.org/">Vermont Complex System Institute</a>, where I did my thesis on the co-evolution of individuals and institutions.</p>

            <p>My thesis project focused on understanding the impact of learning to code in science and how it  influences the research group life cycles in the midst of the computational revolution. Using group-based models, I investigate the potential tension between group and individual benefits,  given individual relative interests or costs to learn to code. I am part of the <a href="https://verso.w3.uvm.edu/">VERSO</a> project, the open source program office at UVM. </p>

            <p>I enjoy going on PhD sidequests, bringing others' works to life, my own theoretical work, examining how people human biases impact the detection deepfakes in the wild, or finding ways to use scientifically large language models.</p>

        </div>
        <div class="right-hand-side">
            <img src="/profile.jpg" alt="profile" class="profile-pic"/>
        </div>
    </div>
</div>



<style>
    h1 {
        font-family: "DM Sans", sans-serif;
        font-weight: 700;
        margin-top: 10vh;
        margin-bottom: 3vh;
    }

    .about-layout {
        display: flex;
        gap: 5rem;
    }

    .left-hand-side {
        flex: 1;
    }

    .right-hand-side {
        flex-shrink: 0;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        margin-top: calc(10vh + 3vh + 4em);
    }

    .profile-pic {
        width: 400px;
    }

    /* On small screens, stack vertically and hide profile pic */
    @media only screen and (max-width: 767px) {
        .about-layout {
            flex-direction: column;
        }

        .right-hand-side {
            display: none;
        }
    }
</style>