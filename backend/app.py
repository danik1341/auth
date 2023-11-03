from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import or_
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from werkzeug.security import generate_password_hash, check_password_hash

# config data from config.py
from config import Config

# migrate
from flask_migrate import Migrate

# create the app
app = Flask(__name__)
CORS(app)

# from config file
app.config.from_object(Config)

app.config["SQLALCHEMY_DATABASE_URI"]
app.config["JWT_SECRET_KEY"]
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 60 * 60 * 24
# disables a feature that automatically tracks modifications to objects and emits signals
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"]

# this variable, db, will be used for all SQLAlchemy commands
db = SQLAlchemy(app)

migrate = Migrate(app, db)

jwt = JWTManager(app)

owners = db.Table(
    "owners",
    db.Column("user_id", db.Integer, db.ForeignKey("user.id"), primary_key=True),
    db.Column(
        "organization_id",
        db.Integer,
        db.ForeignKey("organization.id"),
        primary_key=True,
    ),
)

admins = db.Table(
    "admins",
    db.Column("user_id", db.Integer, db.ForeignKey("user.id"), primary_key=True),
    db.Column(
        "organization_id",
        db.Integer,
        db.ForeignKey("organization.id"),
        primary_key=True,
    ),
)

employees = db.Table(
    "employees",
    db.Column("user_id", db.Integer, db.ForeignKey("user.id"), primary_key=True),
    db.Column(
        "organization_id",
        db.Integer,
        db.ForeignKey("organization.id"),
        primary_key=True,
    ),
)

pending_invitations = db.Table(
    "pending_invitations",
    db.Column(
        "user_id",
        db.Integer,
        db.ForeignKey("user.id"),
        primary_key=True,
    ),
    db.Column(
        "organization_id",
        db.Integer,
        db.ForeignKey("organization.id"),
        primary_key=True,
    ),
    db.Column("status", db.Boolean, default=False),
    db.Column("user_response", db.Boolean, default=None, nullable=True),
)


# class represent a table in database
class Organization(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)

    # Relationships with users
    owners = db.relationship("User", secondary=owners)
    admins = db.relationship("User", secondary=admins)
    employees = db.relationship("User", secondary=employees)

    # Pending invitations
    pending_invitations = db.relationship("User", secondary=pending_invitations)

    tasks = db.relationship("Task")

    # serializer
    def serialize(self):
        owners_details = [
            {"id": owner.id, "email": owner.email} for owner in self.owners
        ]
        admins_details = [
            {"id": admin.id, "email": admin.email} for admin in self.admins
        ]
        employees_details = [
            {"id": employee.id, "email": employee.email} for employee in self.employees
        ]

        return {
            "id": self.id,
            "name": self.name,
            "owners": owners_details,
            "admins": admins_details,
            "employees": employees_details,
        }


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(
        db.String(80), unique=True, nullable=False
    )  # Changed from username to email
    password = db.Column(
        db.String(1000), nullable=False
    )  # hashed password, length increased from 80 to 1000
    organizations_owning = db.relationship(
        "Organization", secondary=owners, back_populates="owners", overlaps="owners"
    )
    organizations_working = db.relationship(
        "Organization",
        secondary="admins",
        primaryjoin="or_(User.id == admins.c.user_id, User.id == employees.c.user_id)",
        secondaryjoin="Organization.id == admins.c.organization_id",
        back_populates="employees",
    )

    # serializer
    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "organizations_owning": [org.id for org in self.organizations_owning],
            "organizations_working": [org.id for org in self.organizations_working],
        }


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(80), nullable=False)
    description = db.Column(db.Text)
    completed = db.Column(db.Boolean, default=False)
    completed_by = db.Column(db.Integer, db.ForeignKey("user.id"))
    completed_by_email = db.Column(db.String(150))
    completed_at = db.Column(db.DateTime)

    user = db.relationship("User", foreign_keys=completed_by)

    organization_id = db.Column(db.Integer, db.ForeignKey("organization.id"))

    organization = db.relationship("Organization", back_populates="tasks")


@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    hashed_password = generate_password_hash(data["password"], method="pbkdf2:sha256")
    new_user = User(email=data["email"], password=hashed_password)  # Modified here
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created!"}), 201


@app.route("/signin", methods=["POST"])
def signin():
    data = request.get_json()
    user = User.query.filter_by(email=data["email"]).first()  # Modified here
    # tests log
    print("Req data =>", data)
    print("DB query user", user)

    if not user or not check_password_hash(user.password, data["password"]):
        return jsonify({"message": "Invalid credentials!"}), 401
    access_token = create_access_token(identity=user.email)
    return jsonify({"access_token": access_token})


@app.route("/user", methods=["GET"])
@jwt_required()
def get_user_data():
    current_user_email = get_jwt_identity()
    user: User = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify(user.serialize())


@app.route("/user/organizations", methods=["GET"])
@jwt_required()
def get_user_organizations():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    organizations_owning = [org.serialize() for org in user.organizations_owning]
    organizations = Organization.query.filter(
        or_(Organization.admins.any(id=user.id), Organization.employees.any(id=user.id))
    ).all()
    organizations_data = [org.serialize() for org in organizations]

    return jsonify(
        {
            "organizations_owning": organizations_owning,
            "organizations_working": organizations_data,
        }
    )


@app.route("/users", methods=["GET"])
def get_users_by_ids():
    user_ids_param = request.args.get("user_ids")
    user_ids = list(map(int, user_ids_param.split(",")))

    users = User.query.filter(User.id.in_(user_ids)).all()

    serialized_users = [user.serialize() for user in users]
    return jsonify(serialized_users)


@app.route("/users/<int:user_id>/invitations", methods=["GET"])
def get_user_invitations(user_id):
    user = User.query.get(user_id)

    if not user:
        return jsonify({"message": "User not found"}), 404

    invitations = (
        db.session.query(pending_invitations)
        .filter(pending_invitations.c.user_id == user_id)
        .join(Organization, pending_invitations.c.organization_id == Organization.id)
        .with_entities(
            Organization.id,
            Organization.name,
            pending_invitations.c.status,
            pending_invitations.c.user_response,
        )
        .all()
    )

    serialized_invitations = [
        {
            "organization_id": organization_id,
            "organization_name": organization_name,
            "status": status,
            "user_response": user_response,
        }
        for organization_id, organization_name, status, user_response in invitations
    ]

    return jsonify(serialized_invitations)


@app.route("/organizations", methods=["POST"])
@jwt_required()
def add_organization():
    data = request.get_json()
    org_name = data.get("name", "")

    if not org_name:
        return jsonify({"message": "Organization name is required"}), 400

    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    new_org = Organization(name=org_name)

    new_org.owners.append(user)

    if "owners" in data:
        owner_emails = data["owners"]

        for owner_email in owner_emails:
            owner = User.query.filter_by(email=owner_email).first()
            if owner:
                new_org.owners.append(owner)

    db.session.add(new_org)
    db.session.commit()

    return jsonify({"message": "Organization added successfully"}), 201


@app.route("/organizations/<int:org_id>", methods=["PUT"])
@jwt_required()
def update_organization(org_id):
    org = Organization.query.get(org_id)
    if not org:
        return jsonify({"error": "Organization not found"}), 404

    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json
    new_name = data.get("name")
    new_owners = data.get("owners", [])

    if new_name:
        org.name = new_name

    if new_owners:
        for owner_email in new_owners:
            if not owner_email:
                continue

            owner = User.query.filter_by(email=owner_email).first()
            if owner:
                if owner in org.admins:
                    org.admins.remove(owner)
                if owner in org.employees:
                    org.employees.remove(owner)

                if owner not in org.owners:
                    org.owners.append(owner)
            elif not owner:
                return jsonify({"message": "User not found"}), 404

    db.session.commit()
    return jsonify({"message": "Organization updated successfully"}), 200


@app.route("/organizations/<int:org_id>/invite", methods=["POST"])
@jwt_required()
def send_invitation(org_id):
    data = request.get_json()
    email = data.get("email", "")

    if not email:
        return jsonify({"message": "Email is required"}), 400

    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({"message": "Organization not found"}), 404

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    if (
        user in organization.owners
        or user in organization.admins
        or user in organization.employees
    ):
        return (
            jsonify({"message": "User is already an employee of this organization"}),
            400,
        )

    organization.pending_invitations.append(user)
    db.session.commit()

    return jsonify({"message": "Invitation sent successfully"}), 201


@app.route("/organizations/<int:org_id>/accept-invitation", methods=["POST"])
@jwt_required()
def accept_invitation(org_id):
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()

    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({"message": "Organization not found"}), 404

    if not user:
        return jsonify({"message": "User not found"}), 404

    user_id = user.id

    if user_id in (
        organization.employees or organization.owners or organization.admins
    ):
        return jsonify({"message": "User is already part of the organization"}), 403

    db.session.query(pending_invitations).filter(
        pending_invitations.c.organization_id == org_id,
        pending_invitations.c.user_id == user_id,
    ).update(
        {pending_invitations.c.status: True, pending_invitations.c.user_response: True}
    )

    organization.employees.append(User.query.get(user_id))

    db.session.commit()

    return jsonify({"message": "Invitation accepted successfully"}), 200


@app.route("/organizations/<int:org_id>/decline-invitation", methods=["POST"])
@jwt_required()
def decline_invitation(org_id):
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    user_id = user.id

    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({"message": "Organization not found"}), 404

    pending_invitation = (
        db.session.query(pending_invitations)
        .filter(
            pending_invitations.c.organization_id == org_id,
            pending_invitations.c.user_id == user_id,
        )
        .first()
    )

    if not pending_invitation:
        return jsonify({"message": "Invitation not found"}), 404

    db.session.query(pending_invitations).filter(
        pending_invitations.c.organization_id == org_id,
        pending_invitations.c.user_id == user_id,
    ).update({pending_invitations.c.user_response: False})

    db.session.commit()

    return jsonify({"message": "Invitation declined successfully"}), 200


@app.route("/organizations/<int:org_id>/invitations", methods=["GET"])
def get_organization_invitations(org_id):
    organization = Organization.query.get(org_id)

    if not organization:
        return jsonify({"message": "Organization not found"}), 404

    invitations = (
        db.session.query(pending_invitations)
        .filter(pending_invitations.c.organization_id == org_id)
        .join(User, pending_invitations.c.user_id == User.id)
        .with_entities(
            User.id,
            User.email,
            pending_invitations.c.status,
            pending_invitations.c.user_response,
        )
        .all()
    )

    serialized_invitations = [
        {
            "user_id": user_id,
            "user_email": user_email,
            "status": status,
            "user_response": user_response,
        }
        for user_id, user_email, status, user_response in invitations
    ]

    return jsonify(serialized_invitations)


@app.route("/organization/<int:org_id>", methods=["GET"])
def get_organization(org_id):
    organization = Organization.query.get(org_id)

    if not organization:
        return jsonify({"message": "Organization not found"}), 404

    return jsonify(organization.serialize())


@app.route("/delete-pending-invitation", methods=["DELETE"])
def delete_pending_invitation():
    user_id = request.args.get("user_id")
    org_id = request.args.get("org_id")

    if user_id is None or org_id is None:
        return jsonify({"error": "Both user_id and org_id are required."}), 400

    table = db.Model.metadata.tables["pending_invitations"]

    delete_statement = table.delete().where(
        table.c.user_id == user_id, table.c.organization_id == org_id
    )

    db.session.execute(delete_statement)

    db.session.commit()

    return jsonify({"message": "Pending invitation deleted successfully"}), 200


@app.route("/move-employee-to-admin", methods=["POST"])
def move_employee_to_admin():
    user_id = request.json.get("user_id")
    org_id = request.json.get("org_id")

    if user_id is None or org_id is None:
        return jsonify({"error": "Both user_id and org_id are required."}), 400

    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({"error": "Organization not found."}), 404

    user = User.query.get(user_id)
    if user is None:
        return jsonify({"error": "User not found."}), 404

    if user in organization.employees:
        organization.employees.remove(user)
        organization.admins.append(user)
        db.session.commit()
        return (
            jsonify({"message": "User moved from employees to admins successfully"}),
            200,
        )
    else:
        return jsonify({"error": "User not found in employees."}), 404


@app.route("/move-admin-to-employee", methods=["POST"])
def move_admin_to_employee():
    user_id = request.json.get("user_id")
    org_id = request.json.get("org_id")

    if user_id is None or org_id is None:
        return jsonify({"error": "Both user_id and org_id are required."}), 400

    organization = Organization.query.get(org_id)

    if not organization:
        return jsonify({"error": "Organization not found."}), 404

    user = User.query.get(user_id)

    if user is None:
        return jsonify({"error": "User not found."}), 404

    if user in organization.admins:
        organization.admins.remove(user)
        organization.employees.append(user)
        db.session.commit()
        return (
            jsonify({"message": "User moved from admins to employees successfully"}),
            200,
        )
    else:
        return jsonify({"error": "User not found in admins."}), 404


@app.route("/remove-employee", methods=["DELETE"])
def remove_employee():
    user_id = request.args.get("user_id")
    org_id = request.args.get("org_id")

    if user_id is None or org_id is None:
        return jsonify({"error": "Both user_id and org_id are required."}), 400

    organization = Organization.query.get(org_id)

    if not organization:
        return jsonify({"error": "Organization not found."}), 404

    employee = User.query.get(user_id)

    if not employee:
        return jsonify({"error": "Employee not found."}), 404

    if employee in organization.employees:
        organization.employees.remove(employee)
        db.session.commit()
        return jsonify({"message": "Employee removed from employees list."}), 200
    else:
        return jsonify({"error": "Employee is not in the employees list."}), 404


@app.route("/remove-admin", methods=["DELETE"])
def remove_admin():
    user_id = request.args.get("user_id")
    org_id = request.args.get("org_id")

    if user_id is None or org_id is None:
        return jsonify({"error": "Both user_id and org_id are required."}), 400

    organization = Organization.query.get(org_id)

    if not organization:
        return jsonify({"error": "Organization not found."}), 404

    admin = User.query.get(user_id)

    if not admin:
        return jsonify({"error": "Admin not found."}), 404

    if admin in organization.admins:
        organization.admins.remove(admin)
        db.session.commit()
        return jsonify({"message": "Admin removed from admins list."}), 200
    else:
        return jsonify({"error": "Admin is not in the admins list."}), 404


@app.route("/organizations/<int:org_id>/tasks", methods=["POST"])
def add_task_to_organization(org_id):
    task_data = request.get_json()
    title = task_data.get("title")
    description = task_data.get("description")

    if not title or not description:
        return jsonify({"error": "Both title and description are required."}), 400

    organization = Organization.query.get(org_id)

    if not organization:
        return jsonify({"error": "Organization not found."}), 404

    new_task = Task(title=title, description=description, organization=organization)

    organization.tasks.append(new_task)

    db.session.commit()

    return jsonify({"message": "Task added to the organization successfully"}), 201


@app.route("/organizations/<int:org_id>/tasks", methods=["GET"])
def get_organization_tasks(org_id):
    organization = Organization.query.get(org_id)

    if not organization:
        return jsonify({"message": "Organization not found"}), 404

    tasks = Task.query.filter_by(organization_id=org_id).all()

    serialized_tasks = [
        {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "completed_by": task.completed_by,
            "completed_by_email": task.completed_by_email,
            "completed_at": task.completed_at,
        }
        for task in tasks
    ]

    return jsonify(serialized_tasks)


@app.route("/complete-task/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    user_email = get_jwt_identity()
    if not user_email:
        return jsonify({"error": "User not found"}), 404

    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json
    if "date" in data:
        if task.completed:
            return jsonify({"error": "Task is already completed"}), 400

        task.completed = True
        task.completed_by = user.id
        task.completed_by_email = user_email
        task.completed_at = data["date"]

        db.session.commit()
        return jsonify({"message": "Task marked as completed"}), 200
    else:
        return jsonify({"error": "Invalid data format"}), 400


@app.route("/uncheck-task/<int:task_id>", methods=["PUT"])
def uncheck_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    if task.completed:
        task.completed = False
        task.completed_by = None
        task.completed_at = None
        task.completed_by_email = None

        db.session.commit()
        return jsonify({"message": "Task marked as not completed"}), 200
    else:
        return jsonify({"error": "Task is not completed"}), 400


@app.route("/delete-task/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Task deleted successfully"}), 200


if __name__ == "__main__":
    app.run(debug=True)
