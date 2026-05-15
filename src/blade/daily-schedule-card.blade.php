{{-- resources/views/components/daily-schedule-card.blade.php --}}
<section class="card daily-schedule-card" aria-labelledby="daily-schedule-heading">
    <header class="card__header">
        <h2 id="daily-schedule-heading" class="card__title">Daily Schedule</h2>
    </header>

    <div
        data-component="daily-schedule"
        data-user-id="{{ Auth::id() }}"
        data-date="{{ now()->format('Y-m-d') }}"
        data-api-url="{{ route('api.schedule.daily') }}"
    ></div>
</section>
