package colony.event;

import colony.simulation.SimulationEngine;

/**
 * Abstract base class for Martian disasters and unexpected colony events.
 * Encapsulates event metadata (severity, duration in Sols, active state)
 * and defines the polymorphic contract applyEffect().
 */
public abstract class Event {
    public enum Severity { LOW, MEDIUM, HIGH, CRITICAL }

    private final String name;
    private final Severity severity;
    private double duration; // Sols remaining
    private boolean active;
    private final String description;

    public Event(String name, Severity severity, double duration, String description) {
        this.name = name;
        this.severity = severity;
        this.duration = Math.max(0.1, duration);
        this.active = true;
        this.description = description;
    }

    /**
     * Applies disaster-specific physics and modifications to the colony simulation.
     * @param engine reference to the running SimulationEngine
     */
    public abstract void applyEffect(SimulationEngine engine);

    /**
     * Advances event duration each Sol or time step.
     * When duration reaches 0, the event is deactivated.
     */
    public void tick(double deltaSols) {
        if (!active) return;
        this.duration -= deltaSols;
        if (this.duration <= 0.0) {
            this.duration = 0.0;
            this.active = false;
        }
    }

    // Getters and Setters
    public String getName() { return name; }
    public Severity getSeverity() { return severity; }
    public double getDuration() { return duration; }
    public void setDuration(double duration) { this.duration = duration; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getDescription() { return description; }

    @Override
    public String toString() {
        return String.format("[%s] %s Severity | Remaining: %.1f Sols | Active: %s",
                name, severity, duration, active ? "YES" : "NO");
    }
}
