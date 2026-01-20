import React, { useEffect, useRef } from "react";

export default function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        let particles: {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            opacity: number;
            pulse: number;
            pulseSpeed: number;
        }[] = [];
        let gridLines: {
            type: "h" | "v";
            x?: number;
            y?: number;
            offset: number;
            speed: number;
        }[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
            initGrid();
        };

        const initParticles = () => {
            particles = [];
            const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 0.5,
                    speedX: (Math.random() - 0.5) * 0.3,
                    speedY: (Math.random() - 0.5) * 0.3,
                    opacity: Math.random() * 0.5 + 0.1,
                    pulse: Math.random() * Math.PI * 2,
                    pulseSpeed: Math.random() * 0.02 + 0.01
                });
            }
        };

        const initGrid = () => {
            gridLines = [];
            const spacing = 80;
            // Horizontal lines
            for (let y = 0; y < canvas.height; y += spacing) {
                gridLines.push({
                    type: "h",
                    y: y,
                    offset: Math.random() * 100,
                    speed: Math.random() * 0.5 + 0.2
                });
            }
            // Vertical lines
            for (let x = 0; x < canvas.width; x += spacing) {
                gridLines.push({
                    type: "v",
                    x: x,
                    offset: Math.random() * 100,
                    speed: Math.random() * 0.5 + 0.2
                });
            }
        };

        const drawGrid = (time: number) => {
            ctx.strokeStyle = "rgba(225, 195, 122, 0.03)";
            ctx.lineWidth = 1;

            gridLines.forEach((line) => {
                const wave = Math.sin((time * 0.001 + line.offset) * line.speed) * 2;
                ctx.beginPath();
                if (line.type === "h" && line.y !== undefined) {
                    ctx.moveTo(0, line.y + wave);
                    ctx.lineTo(canvas.width, line.y + wave);
                } else if (line.type === "v" && line.x !== undefined) {
                    ctx.moveTo(line.x + wave, 0);
                    ctx.lineTo(line.x + wave, canvas.height);
                }
                ctx.stroke();
            });
        };

        const drawParticles = (_time: number) => {
            particles.forEach((p) => {
                // Update position
                p.x += p.speedX;
                p.y += p.speedY;
                p.pulse += p.pulseSpeed;

                // Wrap around edges
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Pulsing opacity
                const pulseOpacity = p.opacity * (0.5 + Math.sin(p.pulse) * 0.5);

                // Draw particle (star)
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(214, 215, 216, ${pulseOpacity})`;
                ctx.fill();

                // Draw glow for larger particles
                if (p.size > 1.5) {
                    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
                    gradient.addColorStop(0, `rgba(225, 195, 122, ${pulseOpacity * 0.3})`);
                    gradient.addColorStop(1, "rgba(225, 195, 122, 0)");
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        };

        const drawConnections = () => {
            const maxDistance = 120;
            ctx.lineWidth = 0.5;

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < maxDistance) {
                        const opacity = (1 - distance / maxDistance) * 0.1;
                        ctx.strokeStyle = `rgba(225, 195, 122, ${opacity})`;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = (time: number) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw layers
            drawGrid(time);
            drawConnections();
            drawParticles(time);

            animationId = requestAnimationFrame(animate);
        };

        resize();
        window.addEventListener("resize", resize);
        animate(0);

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: 0.8 }}
        />
    );
}
