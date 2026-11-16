"""
routes/seed.py — Realistic multi-city demo seed script.

Seeds events, venues, restaurants, scene discovery events, and in-seat Bolt vendors
across major Indian tech & metro hubs (Bangalore, Mumbai, Delhi, Hyderabad, Chennai).

Guarantees:
1. Sane evening showtimes (e.g., 18:30, 19:00, 19:30, 20:30 IST) — never 04:06 or 01:51.
2. Complete coverage of the 3 JustIn-Time demo scenarios in BOTH Mumbai and Bangalore:
   - Scenario A: Dineout ✓, Scenes ✓, Bolt ✗ (Venue policy disallows in-seat delivery)
   - Scenario B: Bolt ✓, Dineout ✓, Scenes ✓ (All 3 lanes active)
   - Scenario C: Bolt ✓ only — Dineout ✗ (Rush booking < 90 min), Scenes ✗ (Same category)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from database import get_db, engine, Base
import models

from models.venue import Venue
from models.event import Event
from models.booking import Booking
from models.dineout import DineoutRestaurant
from models.scene import SceneEvent
from models.bolt_vendor import BoltVendor

router = APIRouter(prefix="/seed", tags=["Seed & Reset"])

IST_OFFSET = timedelta(hours=5, minutes=30)


@router.post("")
def seed_database(db: Session = Depends(get_db)):
    """
    Reset database and populate realistic multi-city demo dataset.
    Idempotent: drops and recreates all tables.
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    now_ist = datetime.now(timezone.utc) + IST_OFFSET
    today_ist = now_ist.strftime("%Y-%m-%d")

    # ═════════════════════════════════════════════════════════════════════════
    # 1. VENUES
    # ═════════════════════════════════════════════════════════════════════════

    # --- MUMBAI VENUES ---
    venue_mumbai_dypatil = Venue(
        name="DY Patil Stadium",
        city="Mumbai",
        address="Sector 7, Nerul, Navi Mumbai",
        lat=19.0449,
        lng=73.0185,
        allows_outside_delivery=False,
        allows_inseat_delivery=False,  # Strict stadium security: Bolt suppressed
        capacity=55000,
    )
    venue_mumbai_palladium = Venue(
        name="Phoenix Palladium",
        city="Mumbai",
        address="462 Senapati Bapat Marg, Lower Parel",
        lat=18.9984,
        lng=72.8258,
        allows_outside_delivery=True,
        allows_inseat_delivery=True,   # Delivery permitted: Bolt eligible
        capacity=1500,
    )
    venue_mumbai_canvas = Venue(
        name="Canvas Laugh Club, Mumbai",
        city="Mumbai",
        address="Lower Parel, Mumbai",
        lat=19.0065,
        lng=72.8290,
        allows_outside_delivery=True,
        allows_inseat_delivery=True,
        capacity=250,
    )

    # --- BANGALORE VENUES ---
    venue_blr_kanteerava = Venue(
        name="Kanteerava Indoor Stadium",
        city="Bangalore",
        address="Kasturba Road, Sampangi Rama Nagar, Bengaluru",
        lat=12.9698,
        lng=77.5926,
        allows_outside_delivery=False,
        allows_inseat_delivery=False,  # Stadium security: Bolt suppressed
        capacity=4000,
    )
    venue_blr_phoenix = Venue(
        name="Phoenix Marketcity",
        city="Bangalore",
        address="Whitefield Main Road, Mahadevapura, Bengaluru",
        lat=12.9958,
        lng=77.6964,
        allows_outside_delivery=True,
        allows_inseat_delivery=True,   # Delivery permitted: Bolt eligible
        capacity=3000,
    )
    venue_blr_goodshepherd = Venue(
        name="Good Shepherd Auditorium",
        city="Bangalore",
        address="Koramangala 6th Block, Bengaluru",
        lat=12.9352,
        lng=77.6245,
        allows_outside_delivery=True,
        allows_inseat_delivery=True,   # Delivery permitted
        capacity=1100,
    )

    # --- DELHI VENUES ---
    venue_delhi_jln = Venue(
        name="Jawaharlal Nehru Stadium",
        city="Delhi",
        address="Pragati Vihar, New Delhi",
        lat=28.5828,
        lng=77.2344,
        allows_outside_delivery=False,
        allows_inseat_delivery=False,
        capacity=60000,
    )
    venue_delhi_cyberhub = Venue(
        name="DLF CyberHub Arena",
        city="Delhi",
        address="DLF Phase 2, Gurugram, NCR",
        lat=28.4950,
        lng=77.0880,
        allows_outside_delivery=True,
        allows_inseat_delivery=True,
        capacity=2500,
    )
    venue_delhi_canvas = Venue(
        name="Canvas Laugh Club, Delhi",
        city="Delhi",
        address="DLF Cyber Hub, Gurugram",
        lat=28.4988,
        lng=77.0874,
        allows_outside_delivery=True,
        allows_inseat_delivery=True,
        capacity=200,
    )

    # --- HYDERABAD VENUES ---
    venue_hyd_gachibowli = Venue(
        name="Gachibowli Indoor Stadium",
        city="Hyderabad",
        address="Old Mumbai Highway, Gachibowli, Hyderabad",
        lat=17.4475,
        lng=78.3489,
        allows_outside_delivery=False,
        allows_inseat_delivery=False,
        capacity=5000,
    )
    venue_hyd_hitex = Venue(
        name="HITEX Exhibition Center",
        city="Hyderabad",
        address="Trade Fair Office Building, Izzathnagar, Hyderabad",
        lat=17.4721,
        lng=78.3734,
        allows_outside_delivery=True,
        allows_inseat_delivery=True,
        capacity=8000,
    )

    # --- CHENNAI VENUES ---
    venue_chn_jln = Venue(
        name="Jawaharlal Nehru Stadium, Chennai",
        city="Chennai",
        address="Raja Muthiah Rd, Kannappar Thidal, Periyamet, Chennai",
        lat=13.0837,
        lng=80.2778,
        allows_outside_delivery=False,
        allows_inseat_delivery=False,
        capacity=40000,
    )
    venue_chn_phoenix = Venue(
        name="Phoenix Marketcity, Chennai",
        city="Chennai",
        address="142 Velachery Road, Indira Gandhi Nagar, Velachery, Chennai",
        lat=12.9918,
        lng=80.2170,
        allows_outside_delivery=True,
        allows_inseat_delivery=True,
        capacity=2000,
    )

    all_venues = [
        venue_mumbai_dypatil, venue_mumbai_palladium, venue_mumbai_canvas,
        venue_blr_kanteerava, venue_blr_phoenix, venue_blr_goodshepherd,
        venue_delhi_jln, venue_delhi_cyberhub, venue_delhi_canvas,
        venue_hyd_gachibowli, venue_hyd_hitex,
        venue_chn_jln, venue_chn_phoenix,
    ]
    db.add_all(all_venues)
    db.commit()
    for v in all_venues:
        db.refresh(v)

    # ═════════════════════════════════════════════════════════════════════════
    # 2. EVENTS (All with realistic evening showtimes: 18:30 - 20:30 IST)
    # ═════════════════════════════════════════════════════════════════════════

    # --- MUMBAI EVENTS ---
    # Event 1: Coldplay (Scenario A: Dineout ✓, Scenes ✓, Bolt ✗)
    evt_mumbai_coldplay = Event(
        name="Coldplay: Music of the Spheres World Tour",
        venue_id=venue_mumbai_dypatil.id,
        city="Mumbai",
        date=today_ist,
        start_time="19:30",
        end_time="23:00",
        category="concert",
        lat=venue_mumbai_dypatil.lat,
        lng=venue_mumbai_dypatil.lng,
        simulated_mins_until_show=180,  # 3 hours lead
        total_seats=55000,
        organizer="BookMyShow Live",
    )
    # Event 2: KBC Live (Scenario B: All 3 active)
    evt_mumbai_kbc = Event(
        name="Kaun Banega Crorepati Live Experience",
        venue_id=venue_mumbai_palladium.id,
        city="Mumbai",
        date=today_ist,
        start_time="18:30",
        end_time="21:30",
        category="other",
        lat=venue_mumbai_palladium.lat,
        lng=venue_mumbai_palladium.lng,
        simulated_mins_until_show=240,  # 4 hours lead
        total_seats=1500,
        organizer="Sony LIV",
    )
    # Event 3: Samay Raina Comedy (Scenario C: Bolt ✓ only — Rush booking < 90m)
    evt_mumbai_samay = Event(
        name="Samay Raina: Unfiltered Stand-up",
        venue_id=venue_mumbai_canvas.id,
        city="Mumbai",
        date=today_ist,
        start_time="20:30",
        end_time="22:00",
        category="comedy",
        lat=venue_mumbai_canvas.lat,
        lng=venue_mumbai_canvas.lng,
        simulated_mins_until_show=45,   # 45 min rush booking
        total_seats=250,
        organizer="OML Entertainment",
    )

    # --- BANGALORE EVENTS ---
    # Event 4: Ed Sheeran (Scenario A in Bangalore: Dineout ✓, Scenes ✓, Bolt ✗)
    evt_blr_edsheeran = Event(
        name="Ed Sheeran: +–=÷× Tour Live in Bangalore",
        venue_id=venue_blr_kanteerava.id,
        city="Bangalore",
        date=today_ist,
        start_time="19:30",
        end_time="22:45",
        category="concert",
        lat=venue_blr_kanteerava.lat,
        lng=venue_blr_kanteerava.lng,
        simulated_mins_until_show=180,  # 3 hours lead
        total_seats=4000,
        organizer="BookMyShow Live",
    )
    # Event 5: Sunburn Arena (Scenario B in Bangalore: All 3 active)
    evt_blr_sunburn = Event(
        name="Sunburn Arena featuring Alan Walker",
        venue_id=venue_blr_phoenix.id,
        city="Bangalore",
        date=today_ist,
        start_time="19:00",
        end_time="23:30",
        category="other",
        lat=venue_blr_phoenix.lat,
        lng=venue_blr_phoenix.lng,
        simulated_mins_until_show=240,  # 4 hours lead
        total_seats=3000,
        organizer="Spacebound & Sunburn",
    )
    # Event 6: Zakir Khan (Scenario C in Bangalore: Bolt ✓ only — Rush 45m booking)
    evt_blr_zakir = Event(
        name="Zakir Khan: Tathastu Special Live",
        venue_id=venue_blr_goodshepherd.id,
        city="Bangalore",
        date=today_ist,
        start_time="20:30",
        end_time="22:15",
        category="comedy",
        lat=venue_blr_goodshepherd.lat,
        lng=venue_blr_goodshepherd.lng,
        simulated_mins_until_show=45,   # 45 min rush booking
        total_seats=1100,
        organizer="OML Entertainment",
    )

    # --- DELHI EVENTS ---
    evt_delhi_arijit = Event(
        name="Arijit Singh Symphony World Tour",
        venue_id=venue_delhi_jln.id,
        city="Delhi",
        date=today_ist,
        start_time="19:30",
        end_time="23:00",
        category="concert",
        lat=venue_delhi_jln.lat,
        lng=venue_delhi_jln.lng,
        simulated_mins_until_show=180,
        total_seats=60000,
        organizer="Wizcraft International",
    )
    evt_delhi_ipl = Event(
        name="IPL Fan Park Live Match Screening",
        venue_id=venue_delhi_cyberhub.id,
        city="Delhi",
        date=today_ist,
        start_time="19:00",
        end_time="23:00",
        category="sport",
        lat=venue_delhi_cyberhub.lat,
        lng=venue_delhi_cyberhub.lng,
        simulated_mins_until_show=240,
        total_seats=2500,
        organizer="BCCI / Disney+ Hotstar",
    )
    evt_delhi_bassi = Event(
        name="Anubhav Singh Bassi: Live in Delhi",
        venue_id=venue_delhi_canvas.id,
        city="Delhi",
        date=today_ist,
        start_time="20:30",
        end_time="22:00",
        category="comedy",
        lat=venue_delhi_canvas.lat,
        lng=venue_delhi_canvas.lng,
        simulated_mins_until_show=45,
        total_seats=200,
        organizer="OML Entertainment",
    )

    # --- HYDERABAD EVENTS ---
    evt_hyd_kalki = Event(
        name="Kalki 2898 AD — Visual & Musical Showcase",
        venue_id=venue_hyd_gachibowli.id,
        city="Hyderabad",
        date=today_ist,
        start_time="19:00",
        end_time="22:30",
        category="movie",
        lat=venue_hyd_gachibowli.lat,
        lng=venue_hyd_gachibowli.lng,
        simulated_mins_until_show=180,
        total_seats=5000,
        organizer="Vyjayanthi Movies",
    )
    evt_hyd_sunburn = Event(
        name="Sunburn Hyderabad Live Arena",
        venue_id=venue_hyd_hitex.id,
        city="Hyderabad",
        date=today_ist,
        start_time="19:30",
        end_time="23:30",
        category="concert",
        lat=venue_hyd_hitex.lat,
        lng=venue_hyd_hitex.lng,
        simulated_mins_until_show=240,
        total_seats=8000,
        organizer="Sunburn India",
    )

    # --- CHENNAI EVENTS ---
    evt_chn_anirudh = Event(
        name="Anirudh Ravichander: Hukum World Tour",
        venue_id=venue_chn_jln.id,
        city="Chennai",
        date=today_ist,
        start_time="19:30",
        end_time="23:15",
        category="concert",
        lat=venue_chn_jln.lat,
        lng=venue_chn_jln.lng,
        simulated_mins_until_show=180,
        total_seats=40000,
        organizer="Sun Pictures Live",
    )
    evt_chn_csk = Event(
        name="Chennai Super Kings Fan Fest & Trophy Tour",
        venue_id=venue_chn_phoenix.id,
        city="Chennai",
        date=today_ist,
        start_time="18:30",
        end_time="21:30",
        category="sport",
        lat=venue_chn_phoenix.lat,
        lng=venue_chn_phoenix.lng,
        simulated_mins_until_show=240,
        total_seats=2000,
        organizer="CSK Cricket Ltd",
    )

    all_events = [
        evt_mumbai_coldplay, evt_mumbai_kbc, evt_mumbai_samay,
        evt_blr_edsheeran, evt_blr_sunburn, evt_blr_zakir,
        evt_delhi_arijit, evt_delhi_ipl, evt_delhi_bassi,
        evt_hyd_kalki, evt_hyd_sunburn,
        evt_chn_anirudh, evt_chn_csk,
    ]
    db.add_all(all_events)
    db.commit()
    for e in all_events:
        db.refresh(e)

    # ═════════════════════════════════════════════════════════════════════════
    # 3. BOOKINGS (Covers Scenarios A, B, C for both Mumbai and Bangalore)
    # ═════════════════════════════════════════════════════════════════════════

    booking_1 = Booking(
        id=1,
        user_id="user_demo_mumbai_a",
        event_id=evt_mumbai_coldplay.id,
        seat_section="Gold Circle",
        price_tier="1",
        quantity=2,
        booking_amount=19998.0,
        booked_at=datetime.now(timezone.utc),
    )
    booking_2 = Booking(
        id=2,
        user_id="user_demo_mumbai_b",
        event_id=evt_mumbai_kbc.id,
        seat_section="VIP Lounge",
        price_tier="1",
        quantity=1,
        booking_amount=4999.0,
        booked_at=datetime.now(timezone.utc),
    )
    booking_3 = Booking(
        id=3,
        user_id="user_demo_delhi_c",
        event_id=evt_delhi_bassi.id,
        seat_section="General",
        price_tier="3",
        quantity=2,
        booking_amount=1998.0,
        booked_at=datetime.now(timezone.utc),
    )
    booking_4 = Booking(
        id=4,
        user_id="user_demo_blr_a",
        event_id=evt_blr_edsheeran.id,
        seat_section="Club Gold",
        price_tier="1",
        quantity=2,
        booking_amount=15998.0,
        booked_at=datetime.now(timezone.utc),
    )
    booking_5 = Booking(
        id=5,
        user_id="user_demo_blr_b",
        event_id=evt_blr_sunburn.id,
        seat_section="Executive",
        price_tier="2",
        quantity=1,
        booking_amount=3499.0,
        booked_at=datetime.now(timezone.utc),
    )
    booking_6 = Booking(
        id=6,
        user_id="user_demo_blr_c",
        event_id=evt_blr_zakir.id,
        seat_section="Front Row",
        price_tier="2",
        quantity=2,
        booking_amount=2998.0,
        booked_at=datetime.now(timezone.utc),
    )

    db.add_all([booking_1, booking_2, booking_3, booking_4, booking_5, booking_6])
    db.commit()

    # ═════════════════════════════════════════════════════════════════════════
    # 4. DINEOUT RESTAURANTS (Within 1.5km of respective venues)
    # ═════════════════════════════════════════════════════════════════════════

    restaurants = [
        # --- Mumbai (DY Patil ~19.0449, 73.0185) ---
        DineoutRestaurant(
            name="The Coastal Kitchen",
            city="Mumbai",
            address="Seawoods Grand Central Mall, Nerul",
            cuisine="Coastal / Seafood",
            lat=19.0462, lng=73.0172,  # ~0.2 km
            avg_prep_time_mins=25, accepts_reservations=True, avg_rating=4.4, price_for_two=1800,
        ),
        DineoutRestaurant(
            name="Nerul Spice Garden",
            city="Mumbai",
            address="Sector 6, Nerul, Navi Mumbai",
            cuisine="North Indian",
            lat=19.0391, lng=73.0213,  # ~0.7 km
            avg_prep_time_mins=30, accepts_reservations=True, avg_rating=4.1, price_for_two=1200,
        ),
        DineoutRestaurant(
            name="Smoke House Deli",
            city="Mumbai",
            address="Sector 8, Nerul",
            cuisine="Continental",
            lat=19.0501, lng=73.0204,  # ~0.6 km
            avg_prep_time_mins=35, accepts_reservations=True, avg_rating=4.3, price_for_two=2200,
        ),
        # --- Mumbai (Palladium ~18.9984, 72.8258) ---
        DineoutRestaurant(
            name="The Bombay Canteen",
            city="Mumbai",
            address="Kamala Mills, Lower Parel",
            cuisine="Modern Indian",
            lat=19.0015, lng=72.8297,  # ~0.38 km
            avg_prep_time_mins=30, accepts_reservations=True, avg_rating=4.6, price_for_two=2400,
        ),
        DineoutRestaurant(
            name="Cafe Zoe",
            city="Mumbai",
            address="Mathuradas Mill Compound, Lower Parel",
            cuisine="European / All Day",
            lat=18.9997, lng=72.8249,  # ~0.25 km
            avg_prep_time_mins=20, accepts_reservations=True, avg_rating=4.3, price_for_two=1600,
        ),
        DineoutRestaurant(
            name="Woodside Inn",
            city="Mumbai",
            address="Tardeo, Lower Parel",
            cuisine="Gastropub",
            lat=19.0028, lng=72.8214,  # ~0.56 km
            avg_prep_time_mins=25, accepts_reservations=True, avg_rating=4.4, price_for_two=2000,
        ),

        # --- Bangalore (Kanteerava ~12.9698, 77.5926) ---
        DineoutRestaurant(
            name="Smoke House Deli - Lavelle Road",
            city="Bangalore",
            address="Lavelle Road, Shanthala Nagar, Bengaluru",
            cuisine="European / Continental",
            lat=12.9712, lng=77.5960,  # ~0.4 km from Kanteerava
            avg_prep_time_mins=25, accepts_reservations=True, avg_rating=4.5, price_for_two=2000,
        ),
        DineoutRestaurant(
            name="The Biere Club",
            city="Bangalore",
            address="20/2 Vittal Mallya Road, Bengaluru",
            cuisine="Craft Brewery / Finger Food",
            lat=12.9718, lng=77.5945,  # ~0.3 km from Kanteerava
            avg_prep_time_mins=20, accepts_reservations=True, avg_rating=4.4, price_for_two=1800,
        ),
        DineoutRestaurant(
            name="Sunny's Italian",
            city="Bangalore",
            address="Lavelle Road, Bengaluru",
            cuisine="Italian / Fine Dining",
            lat=12.9702, lng=77.5980,  # ~0.6 km from Kanteerava
            avg_prep_time_mins=30, accepts_reservations=True, avg_rating=4.3, price_for_two=2200,
        ),

        # --- Bangalore (Phoenix Marketcity ~12.9958, 77.6964) ---
        DineoutRestaurant(
            name="Copper Chimney - Whitefield",
            city="Bangalore",
            address="Phoenix Marketcity 2nd Floor, Mahadevapura",
            cuisine="North Indian / Mughlai",
            lat=12.9962, lng=77.6970,  # ~0.1 km from Phoenix
            avg_prep_time_mins=25, accepts_reservations=True, avg_rating=4.3, price_for_two=1600,
        ),
        DineoutRestaurant(
            name="Cafe Noir - Whitefield",
            city="Bangalore",
            address="Phoenix Marketcity Ground Floor, Mahadevapura",
            cuisine="French Bistro / Cafe",
            lat=12.9955, lng=77.6960,  # ~0.1 km from Phoenix
            avg_prep_time_mins=20, accepts_reservations=True, avg_rating=4.4, price_for_two=1400,
        ),
        DineoutRestaurant(
            name="Barbeque Nation - Whitefield",
            city="Bangalore",
            address="ITPB Main Road, Whitefield",
            cuisine="BBQ / Buffet",
            lat=12.9980, lng=77.6950,  # ~0.3 km from Phoenix
            avg_prep_time_mins=15, accepts_reservations=True, avg_rating=4.2, price_for_two=1800,
        ),

        # --- Bangalore (Good Shepherd Auditorium ~12.9674, 77.6033) ---
        DineoutRestaurant(
            name="Toscano - Richmond Road",
            city="Bangalore",
            address="Richmond Road, Shanthala Nagar",
            cuisine="Italian Gourmet",
            lat=12.9660, lng=77.6040,  # ~0.2 km from Good Shepherd
            avg_prep_time_mins=30, accepts_reservations=True, avg_rating=4.5, price_for_two=2000,
        ),

        # --- Delhi (CyberHub / JLN) ---
        DineoutRestaurant(
            name="Farzi Cafe Gurugram",
            city="Delhi",
            address="DLF Cyber Hub, Phase 2, Gurugram",
            cuisine="Modern Indian",
            lat=28.4952, lng=77.0896,  # ~0.2 km from CyberHub
            avg_prep_time_mins=30, accepts_reservations=True, avg_rating=4.2, price_for_two=2000,
        ),
        DineoutRestaurant(
            name="SodaBottleOpenerWala CyberHub",
            city="Delhi",
            address="Cyber Hub, Gurugram",
            cuisine="Parsi / Iranian Cafe",
            lat=28.4960, lng=77.0885,  # ~0.15 km from CyberHub
            avg_prep_time_mins=25, accepts_reservations=True, avg_rating=4.4, price_for_two=1500,
        ),
        DineoutRestaurant(
            name="Lodhi Restaurant & Garden",
            city="Delhi",
            address="Lodhi Road, New Delhi",
            cuisine="European / Pan Asian",
            lat=28.5840, lng=77.2320,  # ~0.3 km from JLN Stadium
            avg_prep_time_mins=35, accepts_reservations=True, avg_rating=4.5, price_for_two=2800,
        ),
    ]
    db.add_all(restaurants)
    db.commit()

    # ═════════════════════════════════════════════════════════════════════════
    # 5. SCENE EVENTS (Nearby discovery events in ±3h window around main event)
    # ═════════════════════════════════════════════════════════════════════════

    scenes = [
        # --- Mumbai Scenes (Near DY Patil for Coldplay concert) ---
        SceneEvent(
            name="Kunal Kamra: Off the Record",
            city="Mumbai",
            venue_name="The Comedy Store, Nerul",
            address="Palm Beach Galleria, Nerul",
            category="comedy",
            date=today_ist,
            start_time="18:00",  # 1.5h before Coldplay (within ±3h)
            lat=19.0436, lng=73.0201,  # ~0.2 km
            entry_fee=699, available_spots=80,
        ),
        SceneEvent(
            name="Artisan Night Market — Nerul Edition",
            city="Mumbai",
            venue_name="Nerul Balaji Mandir Grounds",
            address="Nerul West, Navi Mumbai",
            category="art",
            date=today_ist,
            start_time="17:30",  # 2h before Coldplay (within ±3h)
            lat=19.0471, lng=73.0162,  # ~0.3 km
            entry_fee=0, available_spots=500,
        ),
        # --- Mumbai Scene (Near Palladium for KBC) ---
        SceneEvent(
            name="DJ Night: Nucleya Live at BFlat",
            city="Mumbai",
            venue_name="BFlat Bar & Live Music",
            address="Kamala Mills, Mumbai",
            category="dj",
            date=today_ist,
            start_time="21:00",  # after KBC (within ±3h)
            lat=19.0052, lng=72.8237,  # ~0.3 km
            entry_fee=1299, available_spots=150,
        ),

        # --- Bangalore Scenes (Near Kanteerava for Ed Sheeran concert) ---
        SceneEvent(
            name="Bangalore Comedy Showcase at Church Street",
            city="Bangalore",
            venue_name="Church Street Social",
            address="Church Street, Shanthala Nagar, Bengaluru",
            category="comedy",  # Adjacent to concert
            date=today_ist,
            start_time="18:00",  # 1.5h before Ed Sheeran
            lat=12.9745, lng=77.6050,  # ~1.4 km from Kanteerava
            entry_fee=499, available_spots=100,
        ),
        SceneEvent(
            name="Chitra Santhe Artisan Pop-Up Market",
            city="Bangalore",
            venue_name="Karnataka Chitrakala Parishath",
            address="Kumara Krupa Rd, Bengaluru",
            category="art",  # Adjacent to concert
            date=today_ist,
            start_time="17:30",  # 2h before Ed Sheeran
            lat=12.9710, lng=77.5910,  # ~0.2 km from Kanteerava
            entry_fee=0, available_spots=400,
        ),
        # --- Bangalore Scene (Near Phoenix Marketcity for Sunburn) ---
        SceneEvent(
            name="Underground DJ Night: Tech-House Live",
            city="Bangalore",
            venue_name="VR Bengaluru Sky Deck",
            address="Whitefield Main Road, Bengaluru",
            category="dj",
            date=today_ist,
            start_time="21:00",  # 2h after Sunburn start
            lat=12.9970, lng=77.6980,  # ~0.2 km from Phoenix Marketcity
            entry_fee=999, available_spots=200,
        ),
        # --- Bangalore Scene (Near Good Shepherd Koramangala for Zakir Khan comedy show) ---
        # Note: Category is 'comedy' — same as Zakir Khan show → Suppressed by engine!
        SceneEvent(
            name="Koramangala Open Mic Stand-Up",
            city="Bangalore",
            venue_name="The Black Rabbit Lounge",
            address="100 Feet Road, Koramangala, Bengaluru",
            category="comedy",  # Same category as booked comedy event → Suppressed!
            date=today_ist,
            start_time="20:00",
            lat=12.9360, lng=77.6250,  # ~0.1 km from venue
            entry_fee=199, available_spots=40,
        ),

        # --- Delhi Scene (Near Canvas Delhi for Bassi comedy show) ---
        SceneEvent(
            name="Comedy Open Mic — Gurugram",
            city="Delhi",
            venue_name="The Piano Man Jazz Club",
            address="Cyber Hub, Gurugram",
            category="comedy",  # Same category as Bassi → Suppressed!
            date=today_ist,
            start_time="20:00",
            lat=28.4997, lng=77.0863,  # ~0.12 km from Canvas Delhi
            entry_fee=0, available_spots=50,
        ),
    ]
    db.add_all(scenes)
    db.commit()

    # ═════════════════════════════════════════════════════════════════════════
    # 6. BOLT IN-VENUE VENDORS
    # ═════════════════════════════════════════════════════════════════════════

    bolt_vendors = [
        # --- Mumbai: Phoenix Palladium (KBC event) ---
        BoltVendor(
            name="Stadium Bites by Haldiram's",
            venue_id=venue_mumbai_palladium.id,
            vendor_type="food_stall",
            menu_category="snacks",
            stock_capacity=300,
            avg_prep_time_mins=8,
            is_active=True,
        ),
        BoltVendor(
            name="Chai & More (Hot Beverages)",
            venue_id=venue_mumbai_palladium.id,
            vendor_type="pop_up_kitchen",
            menu_category="beverages",
            stock_capacity=200,
            avg_prep_time_mins=5,
            is_active=True,
        ),
        # --- Mumbai: Canvas Laugh Club ---
        BoltVendor(
            name="Laugh & Munch — Snack Counter",
            venue_id=venue_mumbai_canvas.id,
            vendor_type="food_stall",
            menu_category="snacks",
            stock_capacity=100,
            avg_prep_time_mins=7,
            is_active=True,
        ),

        # --- Bangalore: Phoenix Marketcity (Sunburn event) ---
        BoltVendor(
            name="Keventers Express & Thick Shakes",
            venue_id=venue_blr_phoenix.id,
            vendor_type="food_stall",
            menu_category="beverages",
            stock_capacity=350,
            avg_prep_time_mins=6,
            is_active=True,
        ),
        BoltVendor(
            name="Chai Point & Quick Samosas",
            venue_id=venue_blr_phoenix.id,
            vendor_type="pop_up_kitchen",
            menu_category="snacks",
            stock_capacity=250,
            avg_prep_time_mins=5,
            is_active=True,
        ),
        # --- Bangalore: Good Shepherd Auditorium (Zakir Khan comedy event) ---
        BoltVendor(
            name="Good Shepherd Munchies Stall",
            venue_id=venue_blr_goodshepherd.id,
            vendor_type="food_stall",
            menu_category="snacks",
            stock_capacity=120,
            avg_prep_time_mins=7,
            is_active=True,
        ),

        # --- Delhi: CyberHub & Canvas ---
        BoltVendor(
            name="Haldiram's Stadium Express",
            venue_id=venue_delhi_cyberhub.id,
            vendor_type="food_stall",
            menu_category="snacks",
            stock_capacity=400,
            avg_prep_time_mins=8,
            is_active=True,
        ),
        BoltVendor(
            name="CyberHub Quick Bites",
            venue_id=venue_delhi_canvas.id,
            vendor_type="food_stall",
            menu_category="snacks",
            stock_capacity=100,
            avg_prep_time_mins=6,
            is_active=True,
        ),
    ]
    db.add_all(bolt_vendors)
    db.commit()

    return {
        "status": "success",
        "message": "Database reset and seeded successfully across 5 Indian metro cities.",
        "cities": ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai"],
        "seeded": {
            "venues": len(all_venues),
            "events": len(all_events),
            "bookings": 6,
            "restaurants": len(restaurants),
            "scene_events": len(scenes),
            "bolt_vendors": len(bolt_vendors),
        },
        "demo_scenarios": {
            "mumbai": {
                "booking_1": "Coldplay (Concert, 19:30 IST) → Dineout ✓, Scenes ✓, Bolt ✗ (Venue policy: DY Patil)",
                "booking_2": "KBC Live (18:30 IST) → Bolt ✓, Dineout ✓, Scenes ✓ (All 3 lanes)",
                "booking_3": "Samay Comedy (20:30 IST) → Bolt ✓ only (Dineout ✗ < 90m rush, Scenes ✗ same category)",
            },
            "bangalore": {
                "booking_4": "Ed Sheeran (Concert, 19:30 IST) → Dineout ✓, Scenes ✓, Bolt ✗ (Venue policy: Kanteerava)",
                "booking_5": "Sunburn Arena (19:00 IST) → Bolt ✓, Dineout ✓, Scenes ✓ (All 3 lanes)",
                "booking_6": "Zakir Khan (20:30 IST) → Bolt ✓ only (Dineout ✗ < 90m rush, Scenes ✗ same category)",
            }
        },
    }
